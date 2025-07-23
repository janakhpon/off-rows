import { Router } from "express";
import { Request, Response } from "express";
import path from "path";

const router = Router();

// Serve the API documentation page
router.get("/", (req: Request, res: Response) => {
  res.sendFile(path.join(__dirname, '../../public/docs.html'));
});

export default router; 