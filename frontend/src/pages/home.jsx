import React, { useContext, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../contexts/AuthContext';
import {
    Button,
    TextField,
    Container,
    Box,
    Typography,
    Card,
    CardContent,
    IconButton,
    Alert,
    Paper,
    InputAdornment
} from '@mui/material';
import VideoCallIcon from '@mui/icons-material/VideoCall';
import HistoryIcon from '@mui/icons-material/History';
import LogoutIcon from '@mui/icons-material/Logout';
import MeetingRoomIcon from '@mui/icons-material/MeetingRoom';
import { createTheme, ThemeProvider } from '@mui/material/styles';

const theme = createTheme({
    palette: {
        primary: {
            main: '#667eea',
        },
        secondary: {
            main: '#764ba2',
        },
    },
});

export default function Home() {
    const [meetingCode, setMeetingCode] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const { addToUserHistory } = useContext(AuthContext);
    const navigate = useNavigate();

    const generateMeetingCode = () => {
        return Math.random().toString(36).substring(2, 10).toUpperCase();
    };

    const handleJoinMeeting = async () => {
        if (!meetingCode.trim()) {
            setError("Please enter a meeting code");
            return;
        }

        setLoading(true);
        setError("");

        try {
            // Add to history
            await addToUserHistory(meetingCode);
            console.log("✅ Added meeting to history:", meetingCode);
            
            // Navigate to the meeting
            navigate(`/${meetingCode}`);
        } catch (err) {
            console.error("❌ Error joining meeting:", err);
            setError("Failed to join meeting. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    const handleNewMeeting = async () => {
        setLoading(true);
        setError("");

        try {
            // Generate random meeting code
            const newCode = generateMeetingCode();
            
            // Add to history
            await addToUserHistory(newCode);
            console.log("✅ Created new meeting:", newCode);
            
            // Navigate to the meeting
            navigate(`/${newCode}`);
        } catch (err) {
            console.error("❌ Error creating meeting:", err);
            setError("Failed to create meeting. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    const handleLogout = () => {
        localStorage.removeItem("token");
        navigate("/auth");
    };

    const handleKeyPress = (e) => {
        if (e.key === 'Enter' && meetingCode.trim()) {
            handleJoinMeeting();
        }
    };

    return (
        <ThemeProvider theme={theme}>
            <Box sx={{ 
                minHeight: '100vh',
                background: 'linear-gradient(135deg, #667eea15 0%, #764ba215 100%)',
                display: 'flex',
                alignItems: 'center',
                py: 4
            }}>
                <Container maxWidth="sm">
                    {/* Header */}
                    <Box sx={{ 
                        display: 'flex', 
                        justifyContent: 'space-between', 
                        alignItems: 'center',
                        mb: 4
                    }}>
                        <Typography variant="h4" fontWeight="bold">
                            VideoMeet
                        </Typography>
                        <Box sx={{ display: 'flex', gap: 1 }}>
                            <IconButton 
                                onClick={() => navigate("/history")}
                                sx={{ 
                                    bgcolor: 'primary.main', 
                                    color: 'white',
                                    '&:hover': { bgcolor: 'primary.dark' }
                                }}
                            >
                                <HistoryIcon />
                            </IconButton>
                            <IconButton 
                                onClick={handleLogout}
                                sx={{ 
                                    bgcolor: 'error.main', 
                                    color: 'white',
                                    '&:hover': { bgcolor: 'error.dark' }
                                }}
                            >
                                <LogoutIcon />
                            </IconButton>
                        </Box>
                    </Box>

                    {/* Main Card */}
                    <Paper elevation={3} sx={{ borderRadius: 3, overflow: 'hidden', mb: 3 }}>
                        <Box sx={{ 
                            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                            color: 'white',
                            p: 4,
                            textAlign: 'center'
                        }}>
                            <VideoCallIcon sx={{ fontSize: 80, mb: 2 }} />
                            <Typography variant="h5" fontWeight="bold" gutterBottom>
                                Start or Join a Meeting
                            </Typography>
                            <Typography variant="body2" sx={{ opacity: 0.9 }}>
                                Connect with anyone, anywhere with high-quality video calls
                            </Typography>
                        </Box>

                        <CardContent sx={{ p: 4 }}>
                            {/* New Meeting Button */}
                            <Button
                                variant="contained"
                                size="large"
                                fullWidth
                                onClick={handleNewMeeting}
                                disabled={loading}
                                startIcon={<VideoCallIcon />}
                                sx={{ 
                                    py: 2,
                                    mb: 3,
                                    fontSize: '1.1rem',
                                    fontWeight: 'bold',
                                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                                    '&:hover': {
                                        background: 'linear-gradient(135deg, #5568d3 0%, #6a3f8a 100%)',
                                    }
                                }}
                            >
                                Start Instant Meeting
                            </Button>

                            {/* Divider */}
                            <Box sx={{ 
                                display: 'flex', 
                                alignItems: 'center', 
                                my: 3 
                            }}>
                                <Box sx={{ flex: 1, height: 1, bgcolor: 'divider' }} />
                                <Typography sx={{ px: 2, color: 'text.secondary', fontWeight: 'bold' }}>
                                    OR
                                </Typography>
                                <Box sx={{ flex: 1, height: 1, bgcolor: 'divider' }} />
                            </Box>

                            {/* Join Meeting Section */}
                            <Typography variant="h6" gutterBottom fontWeight="bold" sx={{ mb: 2 }}>
                                Join Existing Meeting
                            </Typography>
                            
                            {error && (
                                <Alert severity="error" sx={{ mb: 2 }}>
                                    {error}
                                </Alert>
                            )}

                            <TextField
                                fullWidth
                                label="Enter Meeting Code"
                                variant="outlined"
                                value={meetingCode}
                                onChange={(e) => {
                                    setMeetingCode(e.target.value.toUpperCase());
                                    setError("");
                                }}
                                onKeyPress={handleKeyPress}
                                disabled={loading}
                                InputProps={{
                                    startAdornment: (
                                        <InputAdornment position="start">
                                            <MeetingRoomIcon color="action" />
                                        </InputAdornment>
                                    ),
                                }}
                                sx={{ mb: 2 }}
                            />

                            <Button
                                variant="outlined"
                                size="large"
                                fullWidth
                                onClick={handleJoinMeeting}
                                disabled={loading || !meetingCode.trim()}
                                sx={{ 
                                    py: 1.5,
                                    fontSize: '1rem',
                                    fontWeight: 'bold',
                                    borderWidth: 2,
                                    '&:hover': {
                                        borderWidth: 2,
                                    }
                                }}
                            >
                                Join Meeting
                            </Button>
                        </CardContent>
                    </Paper>

                    {/* Info Card */}
                    <Card 
                        elevation={0} 
                        sx={{ 
                            bgcolor: 'primary.main',
                            color: 'white',
                            borderRadius: 3
                        }}
                    >
                        <CardContent sx={{ textAlign: 'center', py: 2 }}>
                            <Typography variant="body2">
                                ✨ All your meetings are automatically saved in history
                            </Typography>
                        </CardContent>
                    </Card>
                </Container>
            </Box>
        </ThemeProvider>
    );
}