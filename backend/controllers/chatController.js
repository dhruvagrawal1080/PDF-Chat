import { memoryStore } from "../utils/memoryStore.js";
import { runChat } from "../utils/chat.js";
import { QdrantClient } from "@qdrant/js-client-rest";

export async function handleQuery(req, res) {
  const { sessionId, query } = req.body;

  const session = memoryStore.get(sessionId);
  if (!session) return res.status(400).json({ error: "Invalid session" });

  try {
    const result = await runChat(query, session.collectionName);
    res.json({ response: result });
  } catch (err) {
    console.error("Chat error:", err);
    res.status(500).json({ error: "Failed to generate response" });
  }
}

export async function cleanupSession(req, res) {
  const { sessionId } = req.body;
  const session = memoryStore.get(sessionId);

  if (!session) return res.status(400).json({ error: "Invalid session" });

  try {
    const client = new QdrantClient({ url: process.env.QDRANT_URL || "http://localhost:6333" });
    await client.deleteCollection(session.collectionName);
    memoryStore.delete(sessionId);
    res.json({ success: true });
  } catch (err) {
    console.error("Cleanup error:", err);
    res.status(500).json({ error: "Failed to cleanup session" });
  }
}
