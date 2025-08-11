
import { useEffect } from 'react';
import { Route, BrowserRouter as Router, Routes, useLocation } from 'react-router-dom';
import { AuthProvider } from './components/auth/AuthContext';
import ProtectedRoute from './components/auth/ProtectedRoute';
import NotificationSystem from './components/NotificationSystem';
import BottomMenu from './components/ui/BottomMenu';
import Footer from './components/ui/Footer';
import Header from './components/ui/Header';
// import Marquee from './components/ui/Marquee';
import StickyGenerateButton from './components/ui/StickyGenerateButton';
import { NotificationProvider } from './context/NotificationContext';
import { useGlobalSongStatus } from './hooks/useGlobalSongStatus';
import { usePostHogTracking, setupGlobalErrorHandling } from './utils/posthog';
import { usePostHog } from 'posthog-js/react';

import AuthPage from './pages/AuthPage';
import ExemplePage from './pages/ExemplePage';
import GeneratePage from './pages/GeneratePage';
import HomePage from './pages/HomePage';
import LeaderboardPage from './pages/LeaderboardPage';
import PaymentSuccessPage from './pages/PaymentSuccessPage';
import ProfilePage from './pages/ProfilePage';
import ResultPage from './pages/ResultPage';
import TarifePage from './pages/TarifePage';
import './styles/App.css';

function App() {
  return (
    <AuthProvider>
      <Router>
        <NotificationProvider>
          <AppContent />
        </NotificationProvider>
      </Router>
    </AuthProvider>
  );
}

function AppContent() {
  // Initialize global song status monitoring
  useGlobalSongStatus();
  
  // Initialize PostHog tracking
  const { trackPageView } = usePostHogTracking();
  const posthog = usePostHog();
  const location = useLocation();
  
  // Setup global error handling
  useEffect(() => {
    if (posthog) {
      setupGlobalErrorHandling(posthog);
    }
  }, [posthog]);
  
  // Track page views when location changes
  useEffect(() => {
    const pageName = location.pathname === '/' ? 'home' : location.pathname.replace('/', '');
    trackPageView(pageName);
  }, [location.pathname, trackPageView]);

  return (
    <div className="App">
      <Header />
      {/* <Marquee /> */}
      <NotificationSystem />
      <Routes>
        {/* Public routes */}
        <Route path="/auth" element={<AuthPage />} />
        <Route path="/" element={<HomePage />} />
        <Route path="/exemple" element={<ExemplePage />} />
        <Route path="/select-style" element={<GeneratePage />} />
        <Route path="/generate" element={<GeneratePage />} />
        <Route path="/leaderboard" element={<LeaderboardPage />} />
        <Route path="/tarife" element={<TarifePage />} />
        
        {/* Protected routes */}
        <Route path="/result" element={
          <ProtectedRoute>
            <ResultPage />
          </ProtectedRoute>
        } />

        <Route path="/profile" element={
          <ProtectedRoute>
            <ProfilePage />
          </ProtectedRoute>
        } />
        <Route path="/payment-success" element={
          <ProtectedRoute>
            <PaymentSuccessPage />
          </ProtectedRoute>
        } />
      </Routes>
      <StickyGenerateButton />
      <BottomMenu />
      <Footer />
    </div>
  );
}

export default App;
