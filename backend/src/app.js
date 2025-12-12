// backend/src/app.js
import express from "express";
import { createServer } from "node:http";
import mongoose from "mongoose";
import connectToSocket from "./controllers/socketManager.js";
import cors from "cors";
import userRoutes from "./routes/user.routes.js";

// ===========================
// Initialize app and server
// ===========================
const app = express();
const server = createServer(app);
const io = connectToSocket(server);

// ===========================
// Configure PORT
// ===========================
const PORT = process.env.PORT || 8000;
app.set("port", PORT);

// ===========================
// Configure CORS
// ===========================
// In production, replace "*" with your deployed frontend URL
app.use(cors({
  origin: "*",
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"]
}));

// ===========================
// Middleware
// ===========================
app.use(express.json({ limit: "40kb" }));
app.use(express.urlencoded({ limit: "40kb", extended: true }));

// ===========================
// Routes
// ===========================
app.use("/api/v1/users", userRoutes);

// Health check endpoint
app.get("/health", (req, res) => {
  return res.json({
    status: "ok",
    message: "Server is running",
    socketConnections: io.engine.clientsCount
  });
});

// Simple test endpoint
app.get("/home", (req, res) => {
  return res.json({ hello: "world" });
});

// ===========================
// Start server function
// ===========================
const startServer = async () => {
  console.log("🔄 Starting server...");

  // ===========================
  // Connect to MongoDB
  // ===========================
  try {
    const mongoUri = process.env.MONGODB_URI;
    if (!mongoUri) {
      console.warn("⚠️ MONGODB_URI is not set. Please set environment variable.");
    }

    const connectionDb = await mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000
    });
    console.log(`✅ MongoDB connected: ${connectionDb.connection.host}`);
  } catch (error) {
    console.error("❌ MongoDB connection error:", error.message);
    console.log("⚠️  Please check:");
    console.log("   1. MongoDB Atlas IP whitelist");
    console.log("   2. Database credentials");
    console.log("   3. Network connection");
    // For Render, comment out process.exit(1) to avoid crash on startup
    // process.exit(1);
  }

  // ===========================
  // Start Express server
  // ===========================
  server.listen(PORT, () => {
    console.log(`🚀 Server listening on port ${PORT}`);
    console.log(`📡 Socket.io ready for connections`);
  });
};

// ===========================
// Execute server start
// ===========================
startServer();
