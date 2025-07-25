import express from "express";
import multer from "multer";
import { handlePDFUpload } from "../controllers/indexController.js";

const router = express.Router();
const storage = multer.memoryStorage();
const upload = multer({ storage });

router.post("/upload", upload.single("pdf"), handlePDFUpload);

export default router;
