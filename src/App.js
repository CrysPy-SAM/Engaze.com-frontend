import React, { useEffect, Suspense, lazy } from 'react';
import './App.css';
import { Route, BrowserRouter as Router, Routes, useLocation } from 'react-router-dom';
import { ThemeProvider, CssBaseline, Box, CircularProgress, Typography, Button } from '@mui/material';
import theme from './theme';
import LandingPage from './pages/landing';
import { AuthProvider } from './contexts/AuthContext';
import { DirectCallProvider } from './contexts/DirectCallContext';
import DirectVideoCallModal from './components/DirectVideoCallModal';
import { GoogleOAuthProvider } from '@react-oauth/google';

// Route Code-Splitting for Optimal Initial Bundle Size & TTI
const Authentication = lazy(() => import('./pages/authentication'));
const HomeComponent = lazy(() => import('./pages/home'));
const ProfilePage = lazy(() => import('./pages/profile'));
const DiscoveryPage = lazy(() => import('./pages/discovery'));
const MatchesPage = lazy(() => import('./pages/matches'));
const SearchPage = lazy(() => import('./pages/search'));
const ChatPage = lazy(() => import('./pages/chat'));
const RandomVideoPage = lazy(() => import('./pages/randomVideo'));
const NotFound = lazy(() => import('./pages/NotFound'));

const GOOGLE_CLIENT_ID = process.env.REACT_APP_GOOGLE_CLIENT_ID || "";

class RouteErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error("Route chunk loading error caught by RouteErrorBoundary:", error, errorInfo);
  }

  handleReload = () => {
    this.setState({ hasError: false });
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '100vh',
            bgcolor: '#0B0D17',
            color: '#FFFFFF',
            px: 3,
            textAlign: 'center',
          }}
        >
          <Typography variant="h5" sx={{ fontWeight: 800, mb: 1.5, color: '#FD3A73' }}>
            Connection Interrupted
          </Typography>
          <Typography variant="body1" sx={{ color: '#9CA3AF', maxWidth: 420, mb: 3 }}>
            A network issue prevented loading this page. Please verify your internet connection and reload.
          </Typography>
          <Button
            variant="contained"
            onClick={this.handleReload}
            sx={{
              background: 'linear-gradient(135deg, #FD3A73 0%, #FF7A00 100%)',
              borderRadius: '9999px',
              px: 4,
              py: 1.2,
              fontWeight: 700,
              textTransform: 'none',
              boxShadow: '0 8px 24px rgba(253, 58, 115, 0.4)',
            }}
          >
            Reload Page
          </Button>
        </Box>
      );
    }
    return this.props.children;
  }
}

function RouteLoadingFallback() {
  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        bgcolor: '#0B0D17',
      }}
    >
      <CircularProgress sx={{ color: '#FD3A73' }} />
    </Box>
  );
}

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
    } else if (path === '/search') {
      document.title = 'Search People — Engaze';
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
            <DirectCallProvider>
              <RouteErrorBoundary>
                <Suspense fallback={<RouteLoadingFallback />}>
                  <Routes>
                    <Route path='/' element={<LandingPage />} />
                    <Route path='/auth' element={<Authentication />} />
                    <Route path='/home' element={<HomeComponent />} />
                    <Route path='/discovery' element={<DiscoveryPage />} />
                    <Route path='/search' element={<SearchPage />} />
                    <Route path='/matches' element={<MatchesPage />} />
                    <Route path='/chat' element={<ChatPage />} />
                    <Route path='/chat/:conversationId' element={<ChatPage />} />
                    <Route path='/random-video' element={<RandomVideoPage />} />
                    <Route path='/random-call' element={<RandomVideoPage />} />
                    <Route path='/profile' element={<ProfilePage />} />
                    <Route path='*' element={<NotFound />} />
                  </Routes>
                </Suspense>
              </RouteErrorBoundary>
              <DirectVideoCallModal />
            </DirectCallProvider>
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
