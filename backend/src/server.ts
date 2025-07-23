import express from "express";
import helmet from "helmet";
import cors from "cors";
import rateLimit from "express-rate-limit";
import pino from "pino";
import path from "path";
import { ENV } from "./config";
import storiesRouter from "./routes/stories";
import s3Router from "./routes/s3";
import tablesRouter from "./routes/tables";
import docsRouter from "./routes/docs";

const logger = pino({ level: process.env.LOG_LEVEL || "info" });

export const app = express();

app.use(express.json({ limit: '10mb' })); // Increased limit for image uploads
app.use(helmet());
app.use(express.static(path.join(__dirname, '../public')));
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
app.use("/api/tables", tablesRouter);
app.use("/docs", docsRouter);

/**
 * @openapi
 * /api/health:
 *   get:
 *     summary: Health check endpoint
 *     tags: [Health]
 *     responses:
 *       200:
 *         description: Server health status
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: "ok"
 *                 env:
 *                   type: string
 *                   description: Current environment
 *                   example: "development"
 */
app.get("/api/health", (req, res) => {
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
