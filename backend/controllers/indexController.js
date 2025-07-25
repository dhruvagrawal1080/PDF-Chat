import fs from "fs/promises";
import { v4 as uuidv4 } from "uuid";
import { memoryStore } from "../utils/memoryStore.js";
import { loadPagesAndIndex } from "../utils/indexing.js";

export async function handlePDFUpload(req, res) {
  const sessionId = uuidv4();
  const pdfBuffer = req.file.buffer;
  const collectionName = `session_${sessionId}`;

  try {
    // Save buffer to a temp file
    const tempPath = `./tmp/${sessionId}.pdf`;
    await fs.mkdir("./tmp", { recursive: true });
    await fs.writeFile(tempPath, pdfBuffer);

    await loadPagesAndIndex(tempPath, collectionName);

    memoryStore.set(sessionId, { buffer: pdfBuffer, collectionName });

    // Delete temp file after indexing
    await fs.unlink(tempPath);

    res.json({ sessionId });
  } catch (err) {
    console.error("Upload error:", err);
    res.status(500).json({ error: "Failed to upload and index PDF" });
  }
}
