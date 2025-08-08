
import { Route, BrowserRouter as Router, Routes } from 'react-router-dom';
import { AuthProvider } from './components/auth/AuthContext';
import ProtectedRoute from './components/auth/ProtectedRoute';
import NotificationSystem from './components/NotificationSystem';
import BottomMenu from './components/ui/BottomMenu';
import Footer from './components/ui/Footer';
import Header from './components/ui/Header';
import Marquee from './components/ui/Marquee';
import StickyGenerateButton from './components/ui/StickyGenerateButton';
import { NotificationProvider } from './context/NotificationContext';
import { useGlobalSongStatus } from './hooks/useGlobalSongStatus';

import AuthPage from './pages/AuthPage';
import GeneratePage from './pages/GeneratePage';
import HomePage from './pages/HomePage';
import LeaderboardPage from './pages/LeaderboardPage';
import LoadingPage from './pages/LoadingPage';
import PaymentSuccessPage from './pages/PaymentSuccessPage';
// import PaymentPage from './pages/PaymentPage'; // Eliminat Stripe
import ExemplePage from './pages/ExemplePage';
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

  return (
    <div className="App">
      <Header />
      <Marquee />
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
        <Route path="/loading" element={
          <ProtectedRoute>
            <LoadingPage />
          </ProtectedRoute>
        } />
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
