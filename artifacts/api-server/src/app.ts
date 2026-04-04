import express, { type Express } from "express";
import cors from "cors";
import router from "./routes";

const app: Express = express();

// CORS — in production set ALLOWED_ORIGIN to your exact frontend domain
const allowedOrigin = process.env.ALLOWED_ORIGIN || "*";
app.use(cors({
  origin: allowedOrigin,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: allowedOrigin !== "*",
}));

// Body parsers — limit JSON to 10 MB to support base64 screenshots (max ~7 MB)
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

if (!process.env.SESSION_SECRET) {
  console.warn(
    "[WARNING] SESSION_SECRET environment variable is not set. " +
    "Using an insecure default. Set SESSION_SECRET in production!"
  );
}

app.use("/api", router);

export default app;
