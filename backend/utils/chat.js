import { ChatGoogleGenerativeAI, GoogleGenerativeAIEmbeddings } from "@langchain/google-genai";
import { END, START, StateGraph } from "@langchain/langgraph";
import { QdrantVectorStore } from "@langchain/qdrant";
import { QdrantClient } from "@qdrant/js-client-rest";
import dotenv from "dotenv";
import z from "zod";

dotenv.config({ quiet: true });

const embeddings = new GoogleGenerativeAIEmbeddings({
    modelName: "models/embedding-001",
    apiKey: process.env.GOOGLE_API_KEY1,
});

const schema = z.object({
    general_query: z.boolean(),
    page_query: z.array(z.number()),
    whole_doc_query: z.boolean(),
});

const state = z.object({
    query: z.string(),
    response: z.string(),
    general_query: z.boolean(),
    page_query: z.array(z.number()),
    whole_doc_query: z.boolean(),
    collectionName: z.string()
});

// Graph nodes
const classifyMessage = async (state) => {
    const systemPrompt = `
  You are an AI assistant. Your job is to detect if the user's query is related to a specific page or require whole document or not.
    if query is related to whole document then return whole_doc_query: True.
    if query is related to specific pages of the document then return page_query: [page number].
    else return general_query: True.

    schema: {
      general_query: boolean,
      page_query: array(number),
      whole_doc_query: boolean
    }
  `;

    const llm = new ChatGoogleGenerativeAI({
        model: "gemini-2.5-flash",
        apiKey: process.env.GOOGLE_API_KEY1,
    }).withStructuredOutput(schema);

    const response = await llm.invoke([
        ["system", systemPrompt],
        ["user", state.query],
    ]);

    state.general_query = response.general_query;
    state.page_query = response.page_query;
    state.whole_doc_query = response.whole_doc_query;
    return state;
};

const routeQuery = (state) => {
    if (state.general_query) return "handle_general_query";
    if (state.whole_doc_query) return "handle_whole_doc_query";
    return "handle_page_query";
};

const handle_general_query = async (state) => {
    const vectorDb = await QdrantVectorStore.fromExistingCollection(embeddings, {
        url: process.env.QDRANT_URL || "http://localhost:6333",
        collectionName: state.collectionName
    });

    const docs = await vectorDb.similaritySearch(state.query, 10);

    const context = docs.map((doc) => `Page ${doc.metadata.page_num}: ${doc.pageContent}`).join("\n\n");

    const llm = new ChatGoogleGenerativeAI({
        model: "gemini-2.5-flash",
        apiKey: process.env.GOOGLE_API_KEY1,
    })

    const SYSTEM_PROMPT = `
    You are a helpful AI Assistant who answer user's query based on the available context retrieved from a PDF file along with page content and page number.

    give response in very brief manner and in professional way to user and also navigate the user to open the right page number to know more.
    do not use '**' in your response instead give response with nice formatting.

    Context:
    ${context}
  `
    const response = await llm.invoke([
        ["system", SYSTEM_PROMPT],
        ["user", state.query],
    ]);

    state.response = response.content;
    return state;
};

const handle_page_query = async (state) => {
    const vectorDb = await QdrantVectorStore.fromExistingCollection(embeddings, {
        url: process.env.QDRANT_URL || "http://localhost:6333",
        collectionName: state.collectionName
    });

    const filter = {
        must: [
            {
                key: "metadata.page_num",
                match: { any: state.page_query.map(num => String(num)) },
            },
        ],
    };

    const docs = await vectorDb.similaritySearch(state.query, state.page_query.length, filter);
    if (!docs.length) {
        state.response = "No content found for the requested pages.";
        return state;
    }

    const context = docs.map(doc => `Page ${doc.metadata.page_num}: ${doc.pageContent}`).join("\n\n");

    const llm = new ChatGoogleGenerativeAI({
        model: "gemini-2.5-flash",
        apiKey: process.env.GOOGLE_API_KEY1,
    })

    const SYSTEM_PROMPT = `
    You are a helpful AI Assistant who answer user's query based on the available context retrieved from a PDF file along with page content and page number.

    give response in very brief manner and in professional way to user and also navigate the user to open the right page number to know more.
    do not use '**' in your response instead give response with nice formatting.

    Context:
    ${context}
  `
    const response = await llm.invoke([
        ["system", SYSTEM_PROMPT],
        ["user", state.query],
    ]);

    state.response = response.content;
    return state;
};

const handle_whole_doc_query = async (state) => {
    const client = new QdrantClient({ url: process.env.QDRANT_URL || "http://localhost:6333" });

    // Scroll to fetch all chunks
    let next_page = 0, all_chunks = [];
    while (true) {
        const { points, next_page_offset } = await client.scroll(
            state.collectionName,
            { limit: 100, offset: next_page }
        );

        const chunks = points;
        const next = next_page_offset;

        all_chunks.push(...chunks);
        if (!next) break;
        next_page = next;
    }

    const sorted_chunks = all_chunks.sort((a, b) =>
        Number(a.payload.metadata.page_num) - Number(b.payload.metadata.page_num)
    );

    const llm = new ChatGoogleGenerativeAI({
        model: "gemini-2.5-flash",
        apiKey: process.env.GOOGLE_API_KEY1,
    })

    const context = sorted_chunks.map(page => `Page ${page.payload.metadata.page_num}: ${page.payload.metadata.page_summary}`).join("\n\n");

    const SYSTEM_PROMPT = `
    You are a helpful AI Assistant who answer user's query based on the available context retrieved from a PDF file along with page content and page number.
    In the context, there are page numbers and summary of the content at that page number.

    give response in very brief manner and in professional way to user.
    do not use '**' in your response instead give response with nice formatting.

    Context:
    ${context}
  `
    const response = await llm.invoke([
        ["system", SYSTEM_PROMPT],
        ["user", state.query],
    ]);

    state.response = response.content;
    return state;
};

// Build the graph
const graph = new StateGraph(state);

graph.addNode("classify_message", classifyMessage);
graph.addNode("handle_general_query", handle_general_query);
graph.addNode("handle_page_query", handle_page_query);
graph.addNode("handle_whole_doc_query", handle_whole_doc_query);

graph.addEdge(START, "classify_message");
graph.addConditionalEdges("classify_message", routeQuery);
graph.addEdge("handle_general_query", END);
graph.addEdge("handle_page_query", END);
graph.addEdge("handle_whole_doc_query", END);

const runner = graph.compile();

export async function runChat(query, collectionName) {
    const state = {
        query: query,
        response: "",
        page_query: [],
        general_query: false,
        whole_doc_query: false,
        collectionName: collectionName
    };

    const { response } = await runner.invoke(state);
    return response;
}
