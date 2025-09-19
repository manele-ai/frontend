
import { useEffect } from 'react';
import { Route, BrowserRouter as Router, Routes, useLocation } from 'react-router-dom';
import { AuthProvider } from './components/auth/AuthContext';
import ProtectedRoute from './components/auth/ProtectedRoute';
import CookieConsent from './components/CookieConsent';
import NotificationSystem from './components/NotificationSystem';
import BottomMenu from './components/ui/BottomMenu';
import Footer from './components/ui/Footer';
import Header from './components/ui/Header';
import { useScrollToTop } from './hooks/useScrollToTop';
// import Marquee from './components/ui/Marquee';
import { usePostHog } from 'posthog-js/react';
import GlobalGenerationListener from './components/GlobalGenerationListener';
import { SEOManager } from './components/seo';
import StickyGenerateButton from './components/ui/StickyGenerateButton';
import { AudioProvider } from './context/AudioContext';
import { NotificationProvider } from './context/NotificationContext';
import AuthPage from './pages/AuthPage';
import GeneratePage from './pages/GeneratePage';
import HomePage from './pages/HomePage';
import LeaderboardPage from './pages/LeaderboardPage';
import PrivacyPolicyPage from './pages/PrivacyPolicyPage';
import ProfilePage from './pages/ProfilePage';
import ResultPage from './pages/ResultPage';
import TarifePage from './pages/TarifePage';
import TermsAndConditionsPage from './pages/TermsAndConditionsPage';
import { pageView } from './services/meta-pixel';
import './styles/App.css';
import { setupGlobalErrorHandling, usePostHogTracking } from './utils/posthog';

function App() {
  return (
    <AuthProvider>
      <Router>
        <NotificationProvider>
          <GlobalGenerationListener />
          <AppContent />
        </NotificationProvider>
      </Router>
    </AuthProvider>
  );
}

function AppContent() {
  // Initialize PostHog tracking
  const { trackPageView } = usePostHogTracking();
  const posthog = usePostHog();
  const location = useLocation();

  // Scroll to top on route change
  useScrollToTop();

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

  useEffect(() => {
    // Default page view event
    posthog?.capture('$pageview');
  }, [location]);

  useEffect(() => {
    pageView();
  }, [location.pathname, location.search]);

  return (
    <>
      {/* SEO metadata is now handled by SEOManager component */}
      <SEOManager />
      <div className="App">
        <AudioProvider>
          <Header />
          {/* <Marquee /> */}
          <NotificationSystem />
          <CookieConsent />
          <Routes>
            {/* Public routes */}
            <Route path="/auth" element={<AuthPage />} />
            <Route path="/" element={<HomePage />} />
            <Route path="/generate" element={<GeneratePage />} />
            <Route path="/leaderboard" element={<LeaderboardPage />} />
            <Route path="/tarife" element={<TarifePage />} />
            <Route path="/privacy-policy" element={<PrivacyPolicyPage />} />
            <Route path="/terms-and-conditions" element={<TermsAndConditionsPage />} />

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
          </Routes>
          <StickyGenerateButton />
          <BottomMenu />
          <Footer />
        </AudioProvider>
      </div>
    </>
  );
}

export default App;
