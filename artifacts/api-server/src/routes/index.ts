import { Router, type IRouter } from "express";
import healthRouter from "./health.js";
import authRouter from "./auth.js";
import depositsRouter from "./deposits.js";
import miningRouter from "./mining.js";
import conversionsRouter from "./conversions.js";
import walletRouter from "./wallet.js";
import referralsRouter from "./referrals.js";
import withdrawalsRouter from "./withdrawals.js";
import systemRouter from "./system.js";
import adminRouter from "./admin.js";
import levelsRouter from "./levels.js";
import kycRouter from "./kyc.js";
import verifyRouter from "./verify.js";

const router: IRouter = Router();

router.use(healthRouter);
router.use("/auth", authRouter);
router.use("/deposits", depositsRouter);
router.use("/mining", miningRouter);
router.use("/conversions", conversionsRouter);
router.use("/wallet", walletRouter);
router.use("/referrals", referralsRouter);
router.use("/withdrawals", withdrawalsRouter);
router.use("/system", systemRouter);
router.use("/admin", adminRouter);
router.use("/levels", levelsRouter);
router.use("/kyc", kycRouter);
router.use("/verify", verifyRouter);

export default router;
