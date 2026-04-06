import { Router } from "express";
import { db, usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { signToken, hashPassword, comparePassword, requireAuth } from "../lib/auth.js";
import { randomBytes } from "crypto";

const router = Router();

/** Only allow safe username characters */
const USERNAME_RE = /^[a-zA-Z0-9_]{3,30}$/;

function generateReferralCode(): string {
  return randomBytes(4).toString("hex").toUpperCase();
}

// POST /auth/signup
router.post("/signup", async (req, res) => {
  try {
    const { username, password, confirmPassword, recoveryQuestion, recoveryAnswer, referredBy } = req.body;

    if (!username || !password || !confirmPassword || !recoveryQuestion || !recoveryAnswer) {
      res.status(400).json({ error: "All fields are required" });
      return;
    }

    if (!USERNAME_RE.test(username)) {
      res.status(400).json({ error: "Username must be 3–30 characters and contain only letters, numbers, or underscores" });
      return;
    }

    if (password !== confirmPassword) {
      res.status(400).json({ error: "Passwords do not match" });
      return;
    }

    if (password.length < 6) {
      res.status(400).json({ error: "Password must be at least 6 characters" });
      return;
    }

    if (typeof recoveryQuestion !== "string" || recoveryQuestion.trim().length < 5) {
      res.status(400).json({ error: "Recovery question must be at least 5 characters" });
      return;
    }

    if (typeof recoveryAnswer !== "string" || recoveryAnswer.trim().length < 2) {
      res.status(400).json({ error: "Recovery answer must be at least 2 characters" });
      return;
    }

    const [existing] = await db.select().from(usersTable).where(eq(usersTable.username, username));
    if (existing) {
      res.status(400).json({ error: "Username already taken" });
      return;
    }

    // Resolve referral
    let referredByUserId: number | undefined;
    if (referredBy) {
      const [referrer] = await db
        .select()
        .from(usersTable)
        .where(eq(usersTable.referralCode, String(referredBy).toUpperCase()));
      if (referrer) referredByUserId = referrer.id;
    }

    const passwordHash = await hashPassword(password);
    const recoveryAnswerHash = await hashPassword(recoveryAnswer.toLowerCase().trim());
    const referralCode = generateReferralCode();

    const [user] = await db.insert(usersTable).values({
      username,
      passwordHash,
      recoveryQuestion: recoveryQuestion.trim(),
      recoveryAnswerHash,
      referralCode,
      referredByUserId,
      // miningStartedAt left null — user must explicitly start mining
    }).returning();

    const token = signToken(user.id);
    res.status(201).json({
      user: {
        id: user.id,
        username: user.username,
        isActive: user.isActive,
        isBanned: user.isBanned,
        isAdmin: user.isAdmin,
        recoveryQuestion: user.recoveryQuestion,
        createdAt: user.createdAt.toISOString(),
      },
      token,
    });
  } catch (err) {
    console.error("Signup error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// POST /auth/login
router.post("/login", async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || typeof username !== "string" || !password || typeof password !== "string") {
      res.status(400).json({ error: "Username and password required" });
      return;
    }

    const [user] = await db.select().from(usersTable).where(eq(usersTable.username, username));

    // Use constant-time comparison to prevent timing attacks
    if (!user) {
      await hashPassword("dummy-timing-prevention");
      res.status(401).json({ error: "Invalid username or password" });
      return;
    }

    const valid = await comparePassword(password, user.passwordHash);
    if (!valid) {
      res.status(401).json({ error: "Invalid username or password" });
      return;
    }

    if (user.isBanned) {
      res.status(403).json({ error: "Your account has been suspended. Please contact support." });
      return;
    }

    const token = signToken(user.id);
    res.json({
      user: {
        id: user.id,
        username: user.username,
        isActive: user.isActive,
        isBanned: user.isBanned,
        isAdmin: user.isAdmin,
        recoveryQuestion: user.recoveryQuestion,
        createdAt: user.createdAt.toISOString(),
      },
      token,
    });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// POST /auth/logout
router.post("/logout", (_req, res) => {
  res.json({ message: "Logged out successfully" });
});

// GET /auth/me
router.get("/me", requireAuth, async (req, res) => {
  const user = (req as any).user;
  res.json({
    id: user.id,
    username: user.username,
    isActive: user.isActive,
    isBanned: user.isBanned,
    isAdmin: user.isAdmin,
    isKycVerified: user.isKycVerified ?? false,
    kycVerifiedAt: user.kycVerifiedAt?.toISOString() ?? null,
    recoveryQuestion: user.recoveryQuestion,
    createdAt: user.createdAt.toISOString(),
  });
});

// POST /auth/recovery
router.post("/recovery", async (req, res) => {
  try {
    const { username, recoveryAnswer, newPassword } = req.body;

    if (!username || !recoveryAnswer || !newPassword) {
      res.status(400).json({ error: "All fields are required" });
      return;
    }

    if (typeof newPassword !== "string" || newPassword.length < 6) {
      res.status(400).json({ error: "New password must be at least 6 characters" });
      return;
    }

    const [user] = await db.select().from(usersTable).where(eq(usersTable.username, username));

    // Always hash to prevent timing attacks
    const answerToCheck = String(recoveryAnswer).toLowerCase().trim();
    if (!user) {
      await comparePassword(answerToCheck, "$2b$12$fakehashfortimingprevention000000000000000000000000000");
      res.status(400).json({ error: "User not found" });
      return;
    }

    const valid = await comparePassword(answerToCheck, user.recoveryAnswerHash);
    if (!valid) {
      res.status(400).json({ error: "Incorrect recovery answer" });
      return;
    }

    const passwordHash = await hashPassword(newPassword);
    await db.update(usersTable).set({ passwordHash }).where(eq(usersTable.id, user.id));
    res.json({ message: "Password updated successfully" });
  } catch (err) {
    console.error("Recovery error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
