import React, { useEffect } from 'react';
import './App.css';
import { Route, BrowserRouter as Router, Routes, useLocation } from 'react-router-dom';
import { ThemeProvider, CssBaseline } from '@mui/material';
import theme from './theme';
import LandingPage from './pages/landing';
import Authentication from './pages/authentication';
import { AuthProvider } from './contexts/AuthContext';
import NotFound from './pages/NotFound';
import HomeComponent from './pages/home';
import ProfilePage from './pages/profile';
import DiscoveryPage from './pages/discovery';
import MatchesPage from './pages/matches';
import ChatPage from './pages/chat';
import RandomVideoPage from './pages/randomVideo';

import { GoogleOAuthProvider } from '@react-oauth/google';

const GOOGLE_CLIENT_ID = process.env.REACT_APP_GOOGLE_CLIENT_ID || "";

function PageTitleManager() {
  const location = useLocation();

  useEffect(() => {
    const path = location.pathname;
    if (path === '/') {
      document.title = 'Engaze — Dating & Live Video Connections';
    } else if (path === '/auth') {
      document.title = 'Sign In or Join — Engaze';
    } else if (path === '/discovery') {
      document.title = 'Discovery — Engaze';
    } else if (path === '/matches') {
      document.title = 'Your Matches — Engaze';
    } else if (path.startsWith('/chat')) {
      document.title = 'Messages & Chat — Engaze';
    } else if (path === '/random-video' || path === '/random-call') {
      document.title = 'Live 1-on-1 Video Dating — Engaze';
    } else if (path === '/profile') {
      document.title = 'Profile & Settings — Engaze';
    } else if (path === '/home') {
      document.title = 'Dashboard — Engaze';
    } else {
      document.title = 'Page Not Found — Engaze';
    }
  }, [location.pathname]);

  return null;
}

function App() {
  const appContent = (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <div className="App">
        <Router>
          <PageTitleManager />
          <AuthProvider>
            <Routes>
              <Route path='/' element={<LandingPage />} />
              <Route path='/auth' element={<Authentication />} />
              <Route path='/home' element={<HomeComponent />} />
              <Route path='/discovery' element={<DiscoveryPage />} />
              <Route path='/matches' element={<MatchesPage />} />
              <Route path='/chat' element={<ChatPage />} />
              <Route path='/chat/:conversationId' element={<ChatPage />} />
              <Route path='/random-video' element={<RandomVideoPage />} />
              <Route path='/random-call' element={<RandomVideoPage />} />
              <Route path='/profile' element={<ProfilePage />} />
              <Route path='*' element={<NotFound />} />
            </Routes>
          </AuthProvider>
        </Router>
      </div>
    </ThemeProvider>
  );

  if (GOOGLE_CLIENT_ID) {
    return (
      <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
        {appContent}
      </GoogleOAuthProvider>
    );
  }

  return appContent;
}

export default App;