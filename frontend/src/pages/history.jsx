import React, { useContext, useEffect, useState } from 'react';
import { AuthContext } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import {
    Container,
    Card,
    CardContent,
    Typography,
    Button,
    Box,
    IconButton,
    CircularProgress,
    Alert,
    Chip,
    Divider,
    Paper,
    Fade,
    Tooltip,
    Snackbar
} from '@mui/material';
import HomeIcon from '@mui/icons-material/Home';
import EventIcon from '@mui/icons-material/Event';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import VideocamIcon from '@mui/icons-material/Videocam';
import RefreshIcon from '@mui/icons-material/Refresh';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import LogoutIcon from '@mui/icons-material/Logout';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
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

export default function History() {
    const { getHistoryOfUser } = useContext(AuthContext);
    const [meetings, setMeetings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [copiedCode, setCopiedCode] = useState(null);
    const [snackbarOpen, setSnackbarOpen] = useState(false);
    const navigate = useNavigate();

    const fetchHistory = async () => {
        try {
            setLoading(true);
            setError(null);

            const token = localStorage.getItem("token");
            
            if (!token) {
                setError("Please login to view history");
                setTimeout(() => navigate("/auth"), 1500);
                return;
            }

            console.log("📜 Fetching meeting history...");
            const response = await getHistoryOfUser();
            
            console.log("📊 History response:", response);

            // Handle response - backend returns array directly
            let meetingsData = [];
            
            if (Array.isArray(response)) {
                meetingsData = response;
            } else if (response && Array.isArray(response.data)) {
                meetingsData = response.data;
            } else {
                console.warn("Unexpected response format:", response);
                meetingsData = [];
            }

            console.log(`✅ Found ${meetingsData.length} meetings`);
            setMeetings(meetingsData);
            
        } catch (err) {
            console.error("❌ Error fetching history:", err);
            
            if (err.response?.status === 401 || err.response?.status === 404) {
                setError("Session expired. Please login again.");
                setTimeout(() => navigate("/auth"), 2000);
            } else {
                setError(err.response?.data?.message || "Failed to load meeting history");
            }
            
            setMeetings([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchHistory();
    }, []);

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        const day = date.getDate().toString().padStart(2, "0");
        const month = (date.getMonth() + 1).toString().padStart(2, "0");
        const year = date.getFullYear();
        return `${day}/${month}/${year}`;
    };

    const formatTime = (dateString) => {
        const date = new Date(dateString);
        const hours = date.getHours().toString().padStart(2, "0");
        const minutes = date.getMinutes().toString().padStart(2, "0");
        return `${hours}:${minutes}`;
    };

    const getRelativeTime = (dateString) => {
        const date = new Date(dateString);
        const now = new Date();
        const diffMs = now - date;
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);

        if (diffMins < 1) return "Just now";
        if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;
        if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
        if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
        return formatDate(dateString);
    };

    const handleCopyCode = (code) => {
        navigator.clipboard.writeText(code);
        setCopiedCode(code);
        setSnackbarOpen(true);
        setTimeout(() => setCopiedCode(null), 2000);
    };

    const handleJoinMeeting = (code) => {
        navigate(`/${code}`);
    };

    const handleLogout = () => {
        localStorage.removeItem("token");
        navigate("/auth");
    };

    return (
        <ThemeProvider theme={theme}>
            <Box sx={{ 
                minHeight: '100vh',
                background: 'linear-gradient(135deg, #667eea15 0%, #764ba215 100%)',
            }}>
                <Container maxWidth="lg" sx={{ py: 4 }}>
                    {/* Header */}
                    <Paper 
                        elevation={0}
                        sx={{ 
                            p: 3,
                            mb: 4,
                            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                            color: 'white',
                            borderRadius: 3
                        }}
                    >
                        <Box sx={{ 
                            display: 'flex', 
                            justifyContent: 'space-between', 
                            alignItems: 'center'
                        }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                <CalendarMonthIcon sx={{ fontSize: 40 }} />
                                <Box>
                                    <Typography variant="h4" fontWeight="bold">
                                        Meeting History
                                    </Typography>
                                    <Typography variant="body2" sx={{ opacity: 0.9, mt: 0.5 }}>
                                        View all your past video meetings
                                    </Typography>
                                </Box>
                            </Box>
                            
                            <Box sx={{ display: 'flex', gap: 1 }}>
                                <Tooltip title="Refresh">
                                    <IconButton 
                                        onClick={fetchHistory}
                                        disabled={loading}
                                        sx={{ 
                                            bgcolor: 'rgba(255,255,255,0.2)',
                                            color: 'white',
                                            '&:hover': { bgcolor: 'rgba(255,255,255,0.3)' }
                                        }}
                                    >
                                        <RefreshIcon />
                                    </IconButton>
                                </Tooltip>
                                
                                <Tooltip title="Home">
                                    <IconButton 
                                        onClick={() => navigate("/home")}
                                        sx={{ 
                                            bgcolor: 'rgba(255,255,255,0.2)',
                                            color: 'white',
                                            '&:hover': { bgcolor: 'rgba(255,255,255,0.3)' }
                                        }}
                                    >
                                        <HomeIcon />
                                    </IconButton>
                                </Tooltip>

                                <Tooltip title="Logout">
                                    <IconButton 
                                        onClick={handleLogout}
                                        sx={{ 
                                            bgcolor: 'rgba(244,67,54,0.8)',
                                            color: 'white',
                                            '&:hover': { bgcolor: 'rgba(244,67,54,1)' }
                                        }}
                                    >
                                        <LogoutIcon />
                                    </IconButton>
                                </Tooltip>
                            </Box>
                        </Box>
                    </Paper>

                    {/* Loading State */}
                    {loading && (
                        <Box sx={{ 
                            display: 'flex', 
                            flexDirection: 'column',
                            justifyContent: 'center', 
                            alignItems: 'center',
                            py: 10 
                        }}>
                            <CircularProgress size={60} thickness={4} />
                            <Typography variant="h6" sx={{ mt: 3, color: 'text.secondary' }}>
                                Loading your meetings...
                            </Typography>
                        </Box>
                    )}

                    {/* Error State */}
                    {!loading && error && (
                        <Fade in={true}>
                            <Alert 
                                severity="error" 
                                sx={{ 
                                    mb: 2,
                                    borderRadius: 2,
                                    fontSize: '1rem'
                                }}
                                action={
                                    <Button color="inherit" size="small" onClick={fetchHistory}>
                                        Retry
                                    </Button>
                                }
                            >
                                {error}
                            </Alert>
                        </Fade>
                    )}

                    {/* Empty State */}
                    {!loading && !error && meetings.length === 0 && (
                        <Fade in={true}>
                            <Paper
                                elevation={0}
                                sx={{ 
                                    textAlign: 'center', 
                                    py: 10,
                                    borderRadius: 3,
                                    border: '2px dashed',
                                    borderColor: 'divider'
                                }}
                            >
                                <EventIcon sx={{ fontSize: 80, color: 'text.secondary', mb: 2, opacity: 0.5 }} />
                                <Typography variant="h5" fontWeight="bold" gutterBottom>
                                    No meetings yet
                                </Typography>
                                <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
                                    Start your first meeting and it will appear here
                                </Typography>
                                <Button 
                                    variant="contained" 
                                    size="large"
                                    startIcon={<VideocamIcon />}
                                    onClick={() => navigate("/home")}
                                    sx={{ 
                                        py: 1.5,
                                        px: 4,
                                        fontSize: '1rem',
                                        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                                    }}
                                >
                                    Start a Meeting
                                </Button>
                            </Paper>
                        </Fade>
                    )}

                    {/* Meetings List */}
                    {!loading && !error && meetings.length > 0 && (
                        <Box>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                                <Typography variant="h6" fontWeight="bold">
                                    Total Meetings: {meetings.length}
                                </Typography>
                            </Box>

                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                                {meetings.map((meeting, index) => (
                                    <Fade in={true} timeout={300 + index * 100} key={meeting._id || index}>
                                        <Card 
                                            elevation={0}
                                            sx={{ 
                                                transition: 'all 0.3s',
                                                border: '1px solid',
                                                borderColor: 'divider',
                                                borderRadius: 3,
                                                '&:hover': { 
                                                    boxShadow: 6,
                                                    transform: 'translateY(-4px)',
                                                    borderColor: 'primary.main'
                                                }
                                            }}
                                        >
                                            <CardContent sx={{ p: 3 }}>
                                                <Box sx={{ 
                                                    display: 'flex', 
                                                    justifyContent: 'space-between',
                                                    alignItems: 'flex-start',
                                                    flexWrap: 'wrap',
                                                    gap: 2
                                                }}>
                                                    {/* Left Section */}
                                                    <Box sx={{ flex: 1, minWidth: 250 }}>
                                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                                                            <Box sx={{
                                                                width: 48,
                                                                height: 48,
                                                                borderRadius: 2,
                                                                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                                                                display: 'flex',
                                                                alignItems: 'center',
                                                                justifyContent: 'center'
                                                            }}>
                                                                <VideocamIcon sx={{ color: 'white', fontSize: 28 }} />
                                                            </Box>
                                                            <Box>
                                                                <Typography 
                                                                    variant="h6" 
                                                                    fontWeight="bold"
                                                                    color="primary"
                                                                >
                                                                    {meeting.meetingCode}
                                                                </Typography>
                                                                <Chip 
                                                                    label={`Meeting #${meetings.length - index}`}
                                                                    size="small"
                                                                    sx={{ 
                                                                        fontSize: '0.75rem',
                                                                        height: 20
                                                                    }}
                                                                />
                                                            </Box>
                                                        </Box>

                                                        <Divider sx={{ my: 2 }} />

                                                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>
                                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                                <EventIcon fontSize="small" color="action" />
                                                                <Typography variant="body2" color="text.secondary">
                                                                    {formatDate(meeting.date)}
                                                                </Typography>
                                                            </Box>
                                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                                <AccessTimeIcon fontSize="small" color="action" />
                                                                <Typography variant="body2" color="text.secondary">
                                                                    {formatTime(meeting.date)}
                                                                </Typography>
                                                            </Box>
                                                        </Box>

                                                        <Typography 
                                                            variant="caption" 
                                                            color="text.secondary"
                                                            sx={{ display: 'block', mt: 1.5, fontStyle: 'italic' }}
                                                        >
                                                            {getRelativeTime(meeting.date)}
                                                        </Typography>
                                                    </Box>

                                                    {/* Right Section - Actions */}
                                                    <Box sx={{ 
                                                        display: 'flex', 
                                                        flexDirection: 'column',
                                                        gap: 1,
                                                        minWidth: 200
                                                    }}>
                                                        <Button
                                                            variant="contained"
                                                            fullWidth
                                                            startIcon={<VideocamIcon />}
                                                            onClick={() => handleJoinMeeting(meeting.meetingCode)}
                                                            sx={{
                                                                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                                                                py: 1
                                                            }}
                                                        >
                                                            Rejoin Meeting
                                                        </Button>
                                                        
                                                        <Button
                                                            variant="outlined"
                                                            fullWidth
                                                            startIcon={
                                                                copiedCode === meeting.meetingCode ? 
                                                                <span>✓</span> : 
                                                                <ContentCopyIcon />
                                                            }
                                                            onClick={() => handleCopyCode(meeting.meetingCode)}
                                                            sx={{ py: 1 }}
                                                        >
                                                            {copiedCode === meeting.meetingCode ? 'Copied!' : 'Copy Code'}
                                                        </Button>
                                                    </Box>
                                                </Box>
                                            </CardContent>
                                        </Card>
                                    </Fade>
                                ))}
                            </Box>
                        </Box>
                    )}
                </Container>

                {/* Snackbar for copy confirmation */}
                <Snackbar
                    open={snackbarOpen}
                    autoHideDuration={2000}
                    onClose={() => setSnackbarOpen(false)}
                    message="Meeting code copied to clipboard!"
                    anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
                />
            </Box>
        </ThemeProvider>
    );
}