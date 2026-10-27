import React, { useEffect, Suspense, lazy } from 'react';
import './App.css';
import { Route, BrowserRouter as Router, Routes, useLocation } from 'react-router-dom';
import { ThemeProvider, CssBaseline, Box, CircularProgress, Typography, Button } from '@mui/material';
import theme from './theme';
import LandingPage from './pages/landing';
import { AuthProvider } from './contexts/AuthContext';
import { DirectCallProvider } from './contexts/DirectCallContext';
const DirectVideoCallModal = lazy(() => import('./components/DirectVideoCallModal'));
// GoogleOAuthProvider loaded lazily inside Authentication route

// Route Code-Splitting for Optimal Initial Bundle Size & TTI
const Authentication = lazy(() => import('./pages/authentication'));
const HomeComponent = lazy(() => import('./pages/home'));
const ProfilePage = lazy(() => import('./pages/profile'));
const DiscoveryPage = lazy(() => import('./pages/discovery'));
const MatchesPage = lazy(() => import('./pages/matches'));
const SearchPage = lazy(() => import('./pages/search'));
const ChatPage = lazy(() => import('./pages/chat'));
const RandomVideoPage = lazy(() => import('./pages/randomVideo'));
const PrivacyPolicy = lazy(() => import('./pages/privacy'));
const TermsOfService = lazy(() => import('./pages/terms'));
const SafetyCenter = lazy(() => import('./pages/safety'));
const NotFound = lazy(() => import('./pages/NotFound'));



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

function updateMetaTag(name, content) {
  let meta = document.querySelector(`meta[name="${name}"]`);
  if (!meta) {
    meta = document.createElement('meta');
    meta.setAttribute('name', name);
    document.head.appendChild(meta);
  }
  meta.setAttribute('content', content);
}

function updateCanonical(url) {
  let link = document.querySelector('link[rel="canonical"]');
  if (url) {
    if (!link) {
      link = document.createElement('link');
      link.setAttribute('rel', 'canonical');
      document.head.appendChild(link);
    }
    link.setAttribute('href', url);
  } else if (link) {
    link.parentNode.removeChild(link);
  }
}

export function PageTitleManager() {
  const location = useLocation();

  useEffect(() => {
    const path = location.pathname;
    if (path === '/') {
      document.title = 'Engaze — Dating Platform & Live 1-on-1 Video Connections';
      updateMetaTag('robots', 'index, follow');
      updateMetaTag('description', 'Engaze is a modern dating platform for genuine singles. Discover compatible profiles, chat with mutual matches, and connect safely via 1-on-1 video dates.');
      updateCanonical('https://www.engaze.date/');
    } else if (path === '/privacy') {
      document.title = 'Privacy Policy — Engaze';
      updateMetaTag('robots', 'index, follow');
      updateMetaTag('description', 'Review the Engaze Privacy Policy to understand how account details, mutual chats, and browser video connections are protected.');
      updateCanonical('https://www.engaze.date/privacy');
    } else if (path === '/terms') {
      document.title = 'Terms of Service — Engaze';
      updateMetaTag('robots', 'index, follow');
      updateMetaTag('description', 'Read the Engaze Terms of Service, member eligibility guidelines, acceptable conduct, and platform rules.');
      updateCanonical('https://www.engaze.date/terms');
    } else if (path === '/safety') {
      document.title = 'Safety Tips & Community Guidelines — Engaze';
      updateMetaTag('robots', 'index, follow');
      updateMetaTag('description', 'Explore dating safety tips, community guidelines, mutual-like protection, and reporting procedures on Engaze.');
      updateCanonical('https://www.engaze.date/safety');
    } else if (path === '/auth') {
      document.title = 'Sign In or Join — Engaze';
      updateMetaTag('robots', 'noindex, follow');
      updateMetaTag('description', 'Sign in or join Engaze to meet compatible singles through mutual matching, chat, and live video dates.');
      updateCanonical('https://www.engaze.date/auth');
    } else if (path === '/discovery') {
      document.title = 'Discovery — Engaze';
      updateMetaTag('robots', 'noindex, nofollow');
      updateCanonical(null);
    } else if (path === '/search') {
      document.title = 'Search People — Engaze';
      updateMetaTag('robots', 'noindex, nofollow');
      updateCanonical(null);
    } else if (path === '/matches') {
      document.title = 'Your Matches — Engaze';
      updateMetaTag('robots', 'noindex, nofollow');
      updateCanonical(null);
    } else if (path.startsWith('/chat')) {
      document.title = 'Messages & Chat — Engaze';
      updateMetaTag('robots', 'noindex, nofollow');
      updateCanonical(null);
    } else if (path === '/random-video' || path === '/random-call') {
      document.title = 'Live 1-on-1 Video Dating — Engaze';
      updateMetaTag('robots', 'noindex, nofollow');
      updateCanonical(null);
    } else if (path === '/profile') {
      document.title = 'Profile & Settings — Engaze';
      updateMetaTag('robots', 'noindex, nofollow');
      updateCanonical(null);
    } else if (path === '/home') {
      document.title = 'Dashboard — Engaze';
      updateMetaTag('robots', 'noindex, nofollow');
      updateCanonical(null);
    } else {
      document.title = 'Page Not Found — Engaze';
      updateMetaTag('robots', 'noindex, nofollow');
      updateCanonical(null);
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
                    <Route path='/privacy' element={<PrivacyPolicy />} />
                    <Route path='/terms' element={<TermsOfService />} />
                    <Route path='/safety' element={<SafetyCenter />} />
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
              <Suspense fallback={null}>
                <DirectVideoCallModal />
              </Suspense>
            </DirectCallProvider>
          </AuthProvider>
        </Router>
      </div>
    </ThemeProvider>
  );

  return appContent;
}

export default App;
