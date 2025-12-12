import express from "express";
import { createServer } from "node:http";
import mongoose from "mongoose";
import connectToSocket from "./controllers/socketManager.js";
import cors from "cors";
import userRoutes from "./routes/user.routes.js";

const app = express();
const server = createServer(app);
const io = connectToSocket(server);

app.set("port", (process.env.PORT || 8000));

// CORS configuration - must be before routes
app.use(cors({
    origin: ["http://localhost:5173", "http://localhost:3000", "http://127.0.0.1:5173"],
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"]
}));

app.use(express.json({ limit: "40kb" }));
app.use(express.urlencoded({ limit: "40kb", extended: true }));

app.use("/api/v1/users", userRoutes);

app.get("/home", (req, res) => {
    return res.json({ "hello": "world" });
});

// Health check endpoint
app.get("/health", (req, res) => {
    return res.json({ 
        status: "ok", 
        message: "Server is running",
        socketConnections: io.engine.clientsCount 
    });
});

const start = async () => {
    try {
        // Fixed MongoDB connection with proper options
        const connectionDb = await mongoose.connect(
            "mongodb+srv://gaurav23bcs114_db_user:TpL1Bqbc9LNtjfYf@video.tbb5odv.mongodb.net/videocall?retryWrites=true&w=majority",
            {
                serverSelectionTimeoutMS: 5000, // Timeout after 5s instead of 30s
                socketTimeoutMS: 45000, // Close sockets after 45s of inactivity
            }
        );
        console.log(`✅ MongoDB connected: ${connectionDb.connection.host}`);
    } catch (error) {
        console.error("❌ MongoDB connection error:", error.message);
        console.log("⚠️  Please check:");
        console.log("   1. MongoDB Atlas IP whitelist");
        console.log("   2. Database credentials");
        console.log("   3. Network connection");
        process.exit(1); // Exit if DB connection fails
    }

    server.listen(app.get("port"), () => {
        console.log(`🚀 Server listening on port ${app.get("port")}`);
        console.log(`📡 Socket.io ready for connections`);
        console.log(`🌐 CORS enabled for: http://localhost:5173`);
    });
};

start();