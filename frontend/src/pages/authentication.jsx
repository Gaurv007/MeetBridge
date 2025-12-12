import * as React from 'react';
import Avatar from '@mui/material/Avatar';
import Button from '@mui/material/Button';
import CssBaseline from '@mui/material/CssBaseline';
import TextField from '@mui/material/TextField';
import Paper from '@mui/material/Paper';
import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import Typography from '@mui/material/Typography';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import { AuthContext } from '../contexts/AuthContext';
import { Snackbar, Alert, CircularProgress } from '@mui/material';
import VideoCallIcon from '@mui/icons-material/VideoCall';

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

export default function Authentication() {
    const [username, setUsername] = React.useState("");
    const [password, setPassword] = React.useState("");
    const [name, setName] = React.useState("");
    const [error, setError] = React.useState("");
    const [message, setMessage] = React.useState("");
    const [formState, setFormState] = React.useState(0);
    const [open, setOpen] = React.useState(false);
    const [loading, setLoading] = React.useState(false);

    const { handleRegister, handleLogin } = React.useContext(AuthContext);

    const handleAuth = async () => {
        // Validation
        if (!username || !password) {
            setError("Username and password are required");
            return;
        }

        if (formState === 1 && !name) {
            setError("Name is required");
            return;
        }

        setLoading(true);
        setError("");

        try {
            if (formState === 0) {
                // Login
                await handleLogin(username, password);
            } else {
                // Register
                const result = await handleRegister(name, username, password);
                setUsername("");
                setName("");
                setPassword("");
                setMessage(result || "Registration successful!");
                setOpen(true);
                setFormState(0);
            }
        } catch (err) {
            console.error(err);
            const errorMessage = err?.response?.data?.message || "An error occurred";
            setError(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    const handleKeyPress = (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            handleAuth();
        }
    };

    return (
        <ThemeProvider theme={theme}>
            <Grid container component="main" sx={{ height: '100vh' }}>
                <CssBaseline />
                
                {/* Left Side - Image/Branding */}
                <Grid
                    item
                    xs={false}
                    sm={4}
                    md={7}
                    sx={{
                        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                        position: 'relative',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexDirection: 'column',
                        color: 'white',
                        padding: 4,
                    }}
                >
                    <VideoCallIcon sx={{ fontSize: 120, mb: 3, opacity: 0.9 }} />
                    <Typography variant="h3" fontWeight="bold" gutterBottom>
                        Welcome to VideoMeet
                    </Typography>
                    <Typography variant="h6" sx={{ opacity: 0.9, textAlign: 'center', maxWidth: 500 }}>
                        Connect with anyone, anywhere. Crystal clear video calls with chat functionality.
                    </Typography>
                </Grid>

                {/* Right Side - Form */}
                <Grid item xs={12} sm={8} md={5} component={Paper} elevation={6} square>
                    <Box
                        sx={{
                            my: 8,
                            mx: 4,
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center',
                            minHeight: 'calc(100vh - 64px)',
                        }}
                    >
                        <Avatar sx={{ 
                            m: 1, 
                            bgcolor: 'primary.main',
                            width: 56,
                            height: 56
                        }}>
                            <LockOutlinedIcon />
                        </Avatar>

                        <Typography component="h1" variant="h5" fontWeight="bold" sx={{ mt: 2 }}>
                            {formState === 0 ? 'Sign In' : 'Create Account'}
                        </Typography>

                        {/* Toggle Buttons */}
                        <Box sx={{ mt: 3, display: 'flex', gap: 2 }}>
                            <Button 
                                variant={formState === 0 ? "contained" : "outlined"} 
                                onClick={() => { 
                                    setFormState(0);
                                    setError("");
                                }}
                                sx={{ minWidth: 120 }}
                            >
                                Sign In
                            </Button>
                            <Button 
                                variant={formState === 1 ? "contained" : "outlined"} 
                                onClick={() => { 
                                    setFormState(1);
                                    setError("");
                                }}
                                sx={{ minWidth: 120 }}
                            >
                                Sign Up
                            </Button>
                        </Box>

                        {/* Form */}
                        <Box component="form" noValidate sx={{ mt: 3, width: '100%' }}>
                            {formState === 1 && (
                                <TextField
                                    margin="normal"
                                    required
                                    fullWidth
                                    id="name"
                                    label="Full Name"
                                    name="name"
                                    value={name}
                                    autoComplete="name"
                                    autoFocus={formState === 1}
                                    onChange={(e) => setName(e.target.value)}
                                    onKeyPress={handleKeyPress}
                                />
                            )}

                            <TextField
                                margin="normal"
                                required
                                fullWidth
                                id="username"
                                label="Username"
                                name="username"
                                value={username}
                                autoComplete="username"
                                autoFocus={formState === 0}
                                onChange={(e) => setUsername(e.target.value)}
                                onKeyPress={handleKeyPress}
                            />

                            <TextField
                                margin="normal"
                                required
                                fullWidth
                                name="password"
                                label="Password"
                                type="password"
                                value={password}
                                id="password"
                                autoComplete="current-password"
                                onChange={(e) => setPassword(e.target.value)}
                                onKeyPress={handleKeyPress}
                            />

                            {error && (
                                <Alert severity="error" sx={{ mt: 2 }}>
                                    {error}
                                </Alert>
                            )}

                            <Button
                                type="button"
                                fullWidth
                                variant="contained"
                                sx={{ 
                                    mt: 3, 
                                    mb: 2,
                                    py: 1.5,
                                    fontSize: '1rem',
                                    fontWeight: 'bold',
                                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                                }}
                                onClick={handleAuth}
                                disabled={loading}
                            >
                                {loading ? (
                                    <CircularProgress size={24} color="inherit" />
                                ) : (
                                    formState === 0 ? "Sign In" : "Create Account"
                                )}
                            </Button>

                            <Typography variant="body2" color="text.secondary" align="center" sx={{ mt: 2 }}>
                                {formState === 0 
                                    ? "Don't have an account? Click Sign Up above"
                                    : "Already have an account? Click Sign In above"
                                }
                            </Typography>
                        </Box>
                    </Box>
                </Grid>
            </Grid>

            <Snackbar
                open={open}
                autoHideDuration={4000}
                onClose={() => setOpen(false)}
                anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
            >
                <Alert onClose={() => setOpen(false)} severity="success" sx={{ width: '100%' }}>
                    {message}
                </Alert>
            </Snackbar>
        </ThemeProvider>
    );
}