import './App.css';
import { Route, BrowserRouter as Router, Routes } from 'react-router-dom';
import { ThemeProvider, CssBaseline } from '@mui/material';
import theme from './theme';
import LandingPage from './pages/landing';
import Authentication from './pages/authentication';
import { AuthProvider } from './contexts/AuthContext';
import VideoMeetComponent from './pages/VideoMeet';
import HomeComponent from './pages/home';
import History from './pages/history';
import ProfilePage from './pages/profile';
import DiscoveryPage from './pages/discovery';
import MatchesPage from './pages/matches';
import ChatPage from './pages/chat';
import RandomVideoPage from './pages/randomVideo';

import { GoogleOAuthProvider } from '@react-oauth/google';

const GOOGLE_CLIENT_ID = process.env.REACT_APP_GOOGLE_CLIENT_ID || "";

function App() {
  const appContent = (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <div className="App">
        <Router>
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
              <Route path='/history' element={<History />} />
              <Route path='/:url' element={<VideoMeetComponent />} />
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