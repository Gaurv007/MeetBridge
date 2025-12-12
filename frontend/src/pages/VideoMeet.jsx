import React, { useEffect, useRef, useState } from 'react';
import TextField from "@mui/material/TextField";
import Button from '@mui/material/Button';
import { io } from "socket.io-client";
import style from "../styles/videoComponent.module.css"
import IconButton from '@mui/material/IconButton';
import VideocamIcon from '@mui/icons-material/Videocam';
import VideocamOffIcon from '@mui/icons-material/VideocamOff';
import MicIcon from '@mui/icons-material/Mic';
import MicOffIcon from '@mui/icons-material/MicOff';
import CallEndIcon from '@mui/icons-material/CallEnd';
import ScreenShareIcon from '@mui/icons-material/ScreenShare';
import StopScreenShareIcon from '@mui/icons-material/StopScreenShare';
import ChatIcon from '@mui/icons-material/Chat';
import CloseIcon from '@mui/icons-material/Close';
import SendIcon from '@mui/icons-material/Send';
import Badge from '@mui/material/Badge';
import servers from '../enviorment';
const server_url = `${servers.prod}`;

const connections = {};
const peerConfigConnection = {
    iceServers: [{ urls: "stun:stun.l.google.com:19302" }]
};

// dummy tracks for fallback
const black = ({ width = 640, height = 480 } = {}) => {
    const canvas = Object.assign(document.createElement("canvas"), { width, height });
    canvas.getContext("2d").fillRect(0, 0, width, height);
    const stream = canvas.captureStream();
    return Object.assign(stream.getVideoTracks()[0], { enabled: false });
};

const silence = () => {
    const ctx = new AudioContext();
    const oscillator = ctx.createOscillator();
    const dst = oscillator.connect(ctx.createMediaStreamDestination());
    oscillator.start();
    ctx.resume();
    return Object.assign(dst.stream.getAudioTracks()[0], { enabled: false });
};

export default function VideoMeet() {

    const socketRef = useRef(null);
    const socketIdRef = useRef(null);
    const localVideoRef = useRef();
    const chatEndRef = useRef(null);

    const [videos, setVideos] = useState([]);
    const [askForUsername, setAskForUsername] = useState(true);
    const [username, setUsername] = useState("");

    const [showModal, setModal] = useState(false);
    const [videoAvailable, setVideoAvailable] = useState(true);
    const [audioAvailable, setAudioAvailable] = useState(true);
    const [video, setVideo] = useState(true);
    const [audio, setAudio] = useState(true);
    const [screen, setScreen] = useState(false);
    const [screenAvailable, setScreenAvailable] = useState(false);
    const [newMessages, setNewMessages] = useState(0);
    
    const [messages, setMessages] = useState([]);
    const [message, setMessage] = useState("");

    // Auto scroll to bottom when new message arrives
    useEffect(() => {
        if (chatEndRef.current) {
            chatEndRef.current.scrollIntoView({ behavior: "smooth" });
        }
    }, [messages]);

    // ========= PERMISSIONS =========
    const getPermissions = async () => {
        try {
            const mediaStream = await navigator.mediaDevices.getUserMedia({
                video: true,
                audio: true
            });

            window.localStream = mediaStream;
            
            const videoTracks = mediaStream.getVideoTracks();
            const audioTracks = mediaStream.getAudioTracks();
            
            setVideoAvailable(videoTracks.length > 0);
            setAudioAvailable(audioTracks.length > 0);
            setVideo(videoTracks.length > 0);
            setAudio(audioTracks.length > 0);

            if (localVideoRef.current) {
                localVideoRef.current.srcObject = mediaStream;
            }

            if (navigator.mediaDevices.getDisplayMedia) {
                setScreenAvailable(true);
            }

            console.log("✅ Permissions granted", {
                video: videoTracks.length > 0,
                audio: audioTracks.length > 0
            });
        } catch (e) {
            console.error("❌ Permission Error:", e);
            alert("Please allow camera and microphone access to continue");
        }
    };

    useEffect(() => {
        getPermissions();
    }, []);

    useEffect(() => {
        if (!askForUsername && localVideoRef.current && window.localStream) {
            localVideoRef.current.srcObject = window.localStream;
        }
    }, [askForUsername]);

    // ========== WEBRTC SIGNAL HANDLER ==========
    const gotMessageFromServer = (fromId, message) => {
        const signal = JSON.parse(message);

        if (fromId === socketIdRef.current) return;

        const peer = connections[fromId];

        if (signal.sdp) {
            peer.setRemoteDescription(new RTCSessionDescription(signal.sdp))
                .then(() => {
                    if (signal.sdp.type === "offer") {
                        peer.createAnswer().then((answer) => {
                            peer.setLocalDescription(answer).then(() => {
                                socketRef.current.emit("signal", fromId, JSON.stringify({ sdp: answer }));
                            });
                        });
                    }
                });
        }

        if (signal.ice) {
            peer.addIceCandidate(new RTCIceCandidate(signal.ice));
        }
    };

    // ========== CREATE PEER CONNECTION ==========
    const createPeer = (id) => {
        const peer = new RTCPeerConnection(peerConfigConnection);

        peer.onicecandidate = (event) => {
            if (event.candidate) {
                socketRef.current.emit("signal", id, JSON.stringify({ ice: event.candidate }));
            }
        };

        peer.ontrack = (event) => {
            const remoteStream = event.streams[0];

            setVideos((old) => {
                const exists = old.find((v) => v.socketId === id);
                if (exists) {
                    return old.map((v) =>
                        v.socketId === id ? { ...v, stream: remoteStream } : v
                    );
                }
                return [...old, { socketId: id, stream: remoteStream }];
            });
        };

        if (window.localStream) {
            window.localStream.getTracks().forEach((track) => {
                peer.addTrack(track, window.localStream);
            });
        } else {
            const fallback = new MediaStream([black(), silence()]);
            fallback.getTracks().forEach((t) => peer.addTrack(t, fallback));
        }

        return peer;
    };

    // ========== SOCKET CONNECTION ==========
    const connectToSocketServer = () => {
        console.log("🔌 Connecting to socket server...", server_url);
        
        socketRef.current = io(server_url, {
            transports: ['websocket', 'polling']
        });

        socketRef.current.on("connect", () => {
            console.log("✅ Socket connected!", socketRef.current.id);
            socketIdRef.current = socketRef.current.id;

            socketRef.current.emit("join-call", window.location.href);
            console.log("📞 Emitted join-call");

            socketRef.current.on("signal", gotMessageFromServer);

            socketRef.current.on("user-join", (newUserId, clients) => {
                console.log("👤 User joined:", newUserId, "Total clients:", clients);
                
                if (newUserId !== socketIdRef.current) {
                    console.log(`New user joined: ${newUserId}`);
                }

                clients.forEach((id) => {
                    if (!connections[id]) {
                        console.log("Creating peer for:", id);
                        connections[id] = createPeer(id);
                    }
                });

                if (newUserId === socketIdRef.current) {
                    for (let id in connections) {
                        if (id === socketIdRef.current) continue;

                        console.log("📤 Sending offer to:", id);
                        const peer = connections[id];
                        peer.createOffer().then((offer) => {
                            peer.setLocalDescription(offer).then(() => {
                                socketRef.current.emit("signal", id, JSON.stringify({ sdp: offer }));
                            });
                        });
                    }
                }
            });

            socketRef.current.on("user-left", (id) => {
                console.log("👋 User left:", id);
                setVideos((videos) => videos.filter((v) => v.socketId !== id));
                if (connections[id]) {
                    connections[id].close();
                    delete connections[id];
                }
            });

            // Listen for chat messages
            socketRef.current.on("chat-message", (data, sender, socketIdSender) => {
                console.log("💬 Received message:", data, "from:", sender);
                
                setMessages((prevMessages) => [
                    ...prevMessages,
                    { sender: sender, data: data, socketId: socketIdSender }
                ]);

                // Increment new messages count if chat is closed
                if (!showModal && socketIdSender !== socketIdRef.current) {
                    setNewMessages((prev) => prev + 1);
                }
            });
        });

        socketRef.current.on("connect_error", (error) => {
            console.error("❌ Socket connection error:", error);
        });

        socketRef.current.on("disconnect", () => {
            console.log("🔌 Socket disconnected");
        });
    };

    // ========== TOGGLE VIDEO ==========
    const toggleVideo = () => {
        if (window.localStream) {
            const videoTrack = window.localStream.getVideoTracks()[0];
            if (videoTrack) {
                videoTrack.enabled = !videoTrack.enabled;
                setVideo(videoTrack.enabled);
            }
        }
    };

    // ========== TOGGLE AUDIO ==========
    const toggleAudio = () => {
        if (window.localStream) {
            const audioTrack = window.localStream.getAudioTracks()[0];
            if (audioTrack) {
                audioTrack.enabled = !audioTrack.enabled;
                setAudio(audioTrack.enabled);
            }
        }
    };

    // ========== DISCONNECT ==========
    const disconnect = () => {
        if (socketRef.current) {
            socketRef.current.disconnect();
        }
        
        if (window.localStream) {
            window.localStream.getTracks().forEach(track => track.stop());
        }

        Object.values(connections).forEach(peer => peer.close());
        
        window.location.href = "/";
    };

    // ========== SEND MESSAGE ==========
    const sendMessage = () => {
        if (message.trim() && socketRef.current) {
            console.log("📤 Sending message:", message);
            socketRef.current.emit("chat-message", message, username);
            setMessage("");
        }
    };

    const handleKeyPress = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    };

    // ========== TOGGLE CHAT ==========
    const toggleChat = () => {
        setModal(!showModal);
        if (!showModal) {
            setNewMessages(0); // Reset badge when opening chat
        }
    };

    // ========== SCREEN SHARE ==========
    const toggleScreenShare = async () => {
        if (!screen) {
            try {
                const screenStream = await navigator.mediaDevices.getDisplayMedia({ 
                    video: true 
                });
                
                const screenTrack = screenStream.getVideoTracks()[0];
                
                Object.values(connections).forEach(peer => {
                    const sender = peer.getSenders().find(s => s.track?.kind === 'video');
                    if (sender) {
                        sender.replaceTrack(screenTrack);
                    }
                });

                if (localVideoRef.current) {
                    localVideoRef.current.srcObject = screenStream;
                }

                screenTrack.onended = () => {
                    toggleScreenShare();
                };

                setScreen(true);
            } catch (error) {
                console.error("Screen share error:", error);
            }
        } else {
            if (window.localStream) {
                const videoTrack = window.localStream.getVideoTracks()[0];
                
                Object.values(connections).forEach(peer => {
                    const sender = peer.getSenders().find(s => s.track?.kind === 'video');
                    if (sender) {
                        sender.replaceTrack(videoTrack);
                    }
                });

                if (localVideoRef.current) {
                    localVideoRef.current.srcObject = window.localStream;
                }
            }
            setScreen(false);
        }
    };

    // ========== CONNECT BUTTON ==========
    const connect = () => {
        if (!username.trim()) {
            alert("Please enter your name");
            return;
        }
        
        console.log("🚀 Connecting with username:", username);
        setAskForUsername(false);
        
        setTimeout(() => {
            if (localVideoRef.current && window.localStream) {
                localVideoRef.current.srcObject = window.localStream;
            }
        }, 100);
        
        connectToSocketServer();
    };

    return (
        <div>
            {askForUsername ? (
                <div className={style.lobbyContainer}>
                    <h2>Enter into Lobby</h2>

                    <TextField
                        label="Name"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        variant="outlined"
                        style={{ marginBottom: '20px' }}
                    />

                    <Button onClick={connect} variant="contained" color="primary">
                        Connect
                    </Button>

                    <div className={style.previewVideo}>
                        <video ref={localVideoRef} autoPlay muted playsInline />
                    </div>
                </div>
            ) : 
                <div className={style.meetVideoContainer}>
                    {/* Chat Room */}
                    {showModal && (
                        <div className={style.chatRoom}>
                            <div className={style.chatHeader}>
                                <h3>💬 Chat</h3>
                                <IconButton onClick={toggleChat} size="small">
                                    <CloseIcon />
                                </IconButton>
                            </div>

                            <div className={style.chattingDisplay}>
                                {messages.length > 0 ? (
                                    messages.map((item, index) => (
                                        <div 
                                            key={index} 
                                            className={
                                                item.socketId === socketIdRef.current 
                                                    ? style.messageRight 
                                                    : style.messageLeft
                                            }
                                        >
                                            <div className={style.messageBubble}>
                                                <p className={style.messageSender}>{item.sender}</p>
                                                <p className={style.messageText}>{item.data}</p>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div className={style.noMessages}>
                                        <ChatIcon style={{ fontSize: 48, opacity: 0.3 }} />
                                        <p>No messages yet</p>
                                        <p>Start the conversation!</p>
                                    </div>
                                )}
                                <div ref={chatEndRef} />
                            </div>

                            <div className={style.chattingArea}>
                                <TextField
                                    value={message}
                                    onChange={(e) => setMessage(e.target.value)}
                                    onKeyPress={handleKeyPress}
                                    placeholder="Type a message..."
                                    variant="outlined"
                                    fullWidth
                                    size="small"
                                    multiline
                                    maxRows={3}
                                />
                                <IconButton 
                                    onClick={sendMessage} 
                                    color="primary"
                                    disabled={!message.trim()}
                                    className={style.sendButton}
                                >
                                    <SendIcon />
                                </IconButton>
                            </div>
                        </div>
                    )}
                    
                    <div className={style.buttonContainer}>
                        <IconButton 
                            style={{color: video ? "white" : "#f44336"}}
                            onClick={toggleVideo}
                        >
                            {video ? <VideocamIcon/> : <VideocamOffIcon/>}
                        </IconButton>

                        <IconButton 
                            style={{color: audio ? "white" : "#f44336"}}
                            onClick={toggleAudio}
                        >
                            {audio ? <MicIcon/> : <MicOffIcon/>}
                        </IconButton>

                        <IconButton 
                            style={{color: "white", backgroundColor: "#f44336"}}
                            onClick={disconnect}
                        >
                            <CallEndIcon/>
                        </IconButton>

                        {screenAvailable && (
                            <IconButton 
                                style={{color: screen ? "#4caf50" : "white"}}
                                onClick={toggleScreenShare}
                            >
                                {screen ? <StopScreenShareIcon/> : <ScreenShareIcon/>}
                            </IconButton>
                        )}

                        <Badge badgeContent={newMessages} max={999} color="error">
                            <IconButton onClick={toggleChat} style={{color: "white"}}>
                                <ChatIcon />
                            </IconButton>
                        </Badge>
                    </div>

                    <video 
                        className={style.meetUserVideo} 
                        ref={localVideoRef} 
                        autoPlay 
                        muted 
                        playsInline 
                    />

                    <div className={style.conferenceView}>
                        {videos.map((video) => (
                            <div className={style.participantVideo} key={video.socketId}>
                                <video
                                    data-socket={video.socketId}
                                    ref={(ref) => {
                                        if (ref && video.stream) {
                                            ref.srcObject = video.stream;
                                        }
                                    }}
                                    autoPlay
                                    playsInline
                                />
                                <span className={style.participantName}>
                                    {video.socketId.substring(0, 8)}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            }
        </div>
    );
}