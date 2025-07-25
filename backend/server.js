import express from "express";
import dotenv from "dotenv";
import cors from "cors"
import uploadRoutes from "./routes/upload.js";
import queryRoutes from "./routes/query.js";

dotenv.config({ quiet: true });

const app = express();
app.use(express.json());

app.use(
  cors({
    origin: process.env.FRONTEND_URL,
    credentials: true,
  })
);

app.use("/api", uploadRoutes);
app.use("/api", queryRoutes);

app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Your server is up and running....'
  });
});

// Handle Undefined Routes
app.use((req, res) => {
  res.status(404).json({ success: false, message: 'Route not found' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`)
});