import { PDFLoader } from "@langchain/community/document_loaders/fs/pdf";
import { GoogleGenerativeAIEmbeddings, ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { QdrantVectorStore } from "@langchain/qdrant";
import dotenv from "dotenv";
import pLimit from "p-limit";

dotenv.config({ quiet: true });

const API_KEYS = [
    process.env.GOOGLE_API_KEY1,
    process.env.GOOGLE_API_KEY2,
    process.env.GOOGLE_API_KEY3,
    process.env.GOOGLE_API_KEY4,
    process.env.GOOGLE_API_KEY5,
];

const llmClients = API_KEYS.map(
    (key) =>
        new ChatGoogleGenerativeAI({
            apiKey: key,
            model: "gemini-2.0-flash",
            temperature: 0,
        })
);

// loading and chunks
async function loadPages(pdfPath) {
    const loader = new PDFLoader(pdfPath);
    return loader.load();
}

async function summarizePage(page, idx) {
    const MAX_RETRIES = 3;
    const BASE = 2000;
    const client = llmClients[idx % llmClients.length];
    // console.log(
    //     `Summarizing page ${idx + 1} using client #${(idx % llmClients.length) + 1}`
    // );

    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
        try {
            await new Promise((r) => setTimeout(r, BASE));
            const res = await client.invoke([
                ["system", "You are a helpful summarizer."],
                ["user", `Summarize this page:\n\n${page.pageContent}`],
            ]);
            // console.log("returning", idx + 1)
            return {
                pageContent: page.pageContent,
                metadata: {
                    page_num: String(page.metadata?.loc?.pageNumber),
                    total_pages: page.metadata?.pdf?.totalPages,
                    source: page.metadata.source,
                    page_summary: res.content.trim(),
                },
            };
        } catch (err) {
            console.error(
                `Attempt ${attempt} failed on page ${idx + 1}:`,
                err.message
            );
            if (attempt === MAX_RETRIES) throw err;
            const backoff = BASE * 2 ** (attempt - 1) + Math.random() * 1000;
            console.log(`Retrying after ${backoff.toFixed(0)}ms...`);
            await new Promise((r) => setTimeout(r, backoff));
        }
    }
}

export async function loadPagesAndIndex(filePath, collectionName) {
    const pages = await loadPages(filePath);
    const limit = pLimit(5);

    const summaries = await Promise.all(
        pages.map((page, idx) => limit(() => summarizePage(page, idx)))
    );

    const embeddings = new GoogleGenerativeAIEmbeddings({
        modelName: "embedding-001",
        apiKey: process.env.GOOGLE_API_KEY1
    });

    await QdrantVectorStore.fromDocuments(summaries, embeddings, {
        url: process.env.QDRANT_URL || "http://localhost:6333",
        collectionName: collectionName,
    });

    console.log(`Stored ${summaries.length} summarized pages.`);
}
