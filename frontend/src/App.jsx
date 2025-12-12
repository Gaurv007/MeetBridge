import { useState } from 'react'
import { Route, BrowserRouter as Router, Routes, Navigate, Outlet } from 'react-router-dom' 
import './App.css'
import Landing from './pages/landing.jsx'
import Homecomponet from './pages/home.jsx'
import Authentication from './pages/authentication.jsx'
import { AuthProvider, AuthContext } from './contexts/AuthContext.jsx' 
import VideoMeet from './pages/VideoMeet.jsx'
import { useContext } from 'react' 

const ProtectedRoute = () => {

    const { isLoggedIn } = useContext(AuthContext); 
    

    if (!isLoggedIn) {
        return <Navigate to="/auth" replace />;
    }

    return <Outlet />;
};

function App() {
    const [count, setCount] = useState(0)

    return (
        <>
            <Router>
                <AuthProvider>
                    <Routes>
                        
                        <Route path='/' element={<Landing/>}/>
                        <Route path='/auth' element={<Authentication/>} />

                     
                        <Route element={<ProtectedRoute />}>
                        
                            <Route path='/home' element={<Homecomponet/>}/>
                            <Route path='/:url' element={<VideoMeet/>} />
                        </Route>

                       
                        <Route path="*" element={<Navigate to="/" replace />} />
                        
                    </Routes>
                </AuthProvider>
            </Router>
        </>
    )
}

export default App