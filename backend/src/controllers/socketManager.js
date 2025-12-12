import { Server } from "socket.io";

let connections = {};
let messages = {};
let timeOnline = {};

const connectToSocket = (server) => {
    const io = new Server(server, {
        cors: {
            origin: "*",
            methods: ["GET", "POST"],
            allowedHeaders: ["*"],
            credentials: true
        }
    });

    io.on("connection", (socket) => {
        console.log("✅ Socket connected:", socket.id);

        socket.on("join-call", (path) => {
            console.log(`📞 User ${socket.id} joining path: ${path}`);

            if (connections[path] === undefined) {
                connections[path] = [];
            }

            connections[path].push(socket.id);
            timeOnline[socket.id] = new Date();

            console.log(`👥 Room ${path} now has ${connections[path].length} user(s)`);

            // Emit "user-join" to match frontend
            for (let a = 0; a < connections[path].length; a++) {
                io.to(connections[path][a]).emit(
                    "user-join",
                    socket.id,
                    connections[path]
                );
            }

            // Send old messages to the new user
            if (messages[path] !== undefined) {
                for (let a = 0; a < messages[path].length; a++) {
                    io.to(socket.id).emit(
                        "chat-message",
                        messages[path][a]['data'],
                        messages[path][a]['sender'],
                        messages[path][a]['socket-id-sender']
                    );
                }
                console.log(`📜 Sent ${messages[path].length} old message(s) to ${socket.id}`);
            }
        });

        socket.on("signal", (toId, message) => {
            console.log(`📤 Signal from ${socket.id} to ${toId}`);
            io.to(toId).emit("signal", socket.id, message);
        });

        socket.on("chat-message", (data, sender) => {
            console.log(`💬 Received chat message from ${sender} (${socket.id}):`, data);

            // Find which room this socket is in
            const [matchingRoom, found] = Object.entries(connections)
                .reduce(([room, isFound], [roomKey, roomValue]) => {
                    if (!isFound && roomValue.includes(socket.id)) {
                        return [roomKey, true];
                    }
                    return [room, isFound];
                }, ['', false]);

            if (found === true) {
                // Store message in room history
                if (messages[matchingRoom] === undefined) {
                    messages[matchingRoom] = [];
                }

                messages[matchingRoom].push({
                    'sender': sender,
                    'data': data,
                    'socket-id-sender': socket.id
                });

                console.log(`📨 Broadcasting message to ${connections[matchingRoom].length} user(s) in room`);

                // Broadcast to all users in the room
                connections[matchingRoom].forEach((elem) => {
                    io.to(elem).emit("chat-message", data, sender, socket.id);
                });
            } else {
                console.error(`❌ Could not find room for socket ${socket.id}`);
            }
        });

        socket.on("disconnect", () => {
            console.log("❌ User disconnected:", socket.id);

            let diffTime = Math.abs(new Date() - timeOnline[socket.id]);
            let key;

            // Find and remove user from all rooms
            for (const [k, v] of Object.entries(connections)) {
                for (let a = 0; a < v.length; a++) {
                    if (v[a] === socket.id) {
                        key = k;

                        // Notify other users in the room
                        for (let b = 0; b < connections[key].length; b++) {
                            if (connections[key][b] !== socket.id) {
                                io.to(connections[key][b]).emit("user-left", socket.id);
                            }
                        }

                        // Remove user from room
                        let index = connections[key].indexOf(socket.id);

                        if (index !== -1) {
                            connections[key].splice(index, 1);
                            console.log(`👋 Removed ${socket.id} from room ${key}`);
                        }

                        // Clean up empty rooms
                        if (connections[key].length === 0) {
                            delete connections[key];
                            delete messages[key]; // Also clean up messages
                            console.log(`🧹 Cleaned up empty room: ${key}`);
                        } else {
                            console.log(`👥 Room ${key} now has ${connections[key].length} user(s)`);
                        }
                    }
                }
            }

            // Clean up user's online time
            delete timeOnline[socket.id];
            
            console.log(`⏱️  User was online for ${Math.floor(diffTime / 1000)} seconds`);
        });
    });

    return io;
};

export default connectToSocket;