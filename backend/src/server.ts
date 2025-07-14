import express from "express";
import helmet from "helmet";
import cors from "cors";
import rateLimit from "express-rate-limit";
import pino from "pino";
import { ENV } from "./config";
import storiesRouter from "./routes/stories";
import s3Router from "./routes/s3";

const logger = pino({ level: process.env.LOG_LEVEL || "info" });

export const app = express();

app.use(express.json({ limit: '10mb' })); // Increased limit for image uploads
app.use(helmet());
// Restrict CORS to frontend dev origins only. Update for production as needed.
app.use(cors({
  origin: [
    "http://localhost:3000",
    "http://127.0.0.1:3000"
  ],
  credentials: true // Only needed if using cookies/auth
}));
// windowMs: 10 * 60 * 1000 sets the window to 10 minutes (10 minutes × 60 seconds × 1000 ms).
// max: allows 100 requests per window per IP.
app.use(rateLimit({ windowMs: 10 * 60 * 1000, max: 100 }));
app.use("/api/stories", storiesRouter);
app.use("/api/s3", s3Router);

app.get("/health", (req, res) => {
  res.json({ status: "ok", env: ENV });
});

app.use(
  (
    err: any,
    req: express.Request,
    res: express.Response,
    next: express.NextFunction,
  ) => {
    logger.error(err);
    res.status(500).json({ error: "Internal Server Error" });
  },
);
