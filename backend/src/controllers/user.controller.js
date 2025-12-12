import { User } from "../models/user.model.js";
import httpStatus from "http-status";
import bcrypt from "bcrypt";
import crypto from "crypto";
import { Meeting } from "../models/meeting.model.js";

const login = async (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).json({ message: "Please provide username and password" });
    }

    try {
        const user = await User.findOne({ username });
        if (!user) {
            return res.status(httpStatus.NOT_FOUND).json({ message: "User not found" });
        }

        const isPasswordCorrect = await bcrypt.compare(password, user.password);

        if (isPasswordCorrect) {
            const token = crypto.randomBytes(20).toString("hex");
            user.token = token;
            await user.save();
            return res.status(httpStatus.OK).json({ token });
        } else {
            return res.status(httpStatus.UNAUTHORIZED).json({ message: "Invalid username or password" });
        }
    } catch (e) {
        console.error("Login error:", e);
        return res.status(500).json({ message: `Something went wrong: ${e.message}` });
    }
};

const register = async (req, res) => {
    const { name, username, password } = req.body;

    if (!name || !username || !password) {
        return res.status(400).json({ message: "Please provide name, username, and password" });
    }

    try {
        const existingUser = await User.findOne({ username });
        if (existingUser) {
            return res.status(httpStatus.CONFLICT).json({ message: "User already exists" });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const newUser = new User({ 
            name, 
            username, 
            password: hashedPassword 
        });
        
        await newUser.save();
        
        res.status(httpStatus.CREATED).json({ message: "User registered successfully" });
    } catch (e) {
        console.error("Register error:", e);
        res.status(500).json({ message: `Something went wrong: ${e.message}` });
    }
};

const getUserHistory = async (req, res) => {
    const { token } = req.body;  // Changed from req.query to req.body

    console.log("📜 Get history request - Token:", token);

    if (!token) {
        return res.status(400).json({ message: "Token is required" });
    }

    try {
        const user = await User.findOne({ token });
        
        if (!user) {
            console.log("❌ User not found for token:", token);
            return res.status(404).json({ message: "User not found or invalid token" });
        }

        console.log("✅ Found user:", user.username);

        const meetings = await Meeting.find({ user_id: user.username }).sort({ date: -1 });
        
        console.log(`📊 Found ${meetings.length} meetings for user ${user.username}`);

        // Return meetings array directly
        res.json(meetings);
    } catch (e) {
        console.error("Get history error:", e);
        res.status(500).json({ message: `Something went wrong: ${e.message}` });
    }
};

const addToHistory = async (req, res) => {
    const { token, meeting_code } = req.body;

    console.log("➕ Add to history - Token:", token, "Meeting code:", meeting_code);

    if (!token || !meeting_code) {
        return res.status(400).json({ message: "Token and meeting code are required" });
    }

    try {
        const user = await User.findOne({ token });
        
        if (!user) {
            console.log("❌ User not found for token:", token);
            return res.status(404).json({ message: "User not found or invalid token" });
        }

        console.log("✅ Found user:", user.username);

        const newMeeting = new Meeting({
            user_id: user.username,
            meetingCode: meeting_code,
            date: new Date()
        });

        await newMeeting.save();

        console.log("✅ Meeting saved:", newMeeting);

        res.status(httpStatus.CREATED).json({ 
            message: "Meeting added to history",
            meeting: newMeeting
        });
    } catch (e) {
        console.error("Add to history error:", e);
        res.status(500).json({ message: `Something went wrong: ${e.message}` });
    }
};

export { login, register, addToHistory, getUserHistory };