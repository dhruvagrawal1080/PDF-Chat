import express from "express";
import { handleQuery, cleanupSession } from "../controllers/chatController.js";

const router = express.Router();

router.post("/ask", handleQuery);
router.post("/cleanup", cleanupSession); // Called on tab reload/close

export default router;
