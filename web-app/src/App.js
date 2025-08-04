import { useEffect } from 'react';
import { Route, BrowserRouter as Router, Routes } from 'react-router-dom';
import { AuthProvider } from './components/auth/AuthContext';
import ProtectedRoute from './components/auth/ProtectedRoute';
import BottomMenu from './components/ui/BottomMenu';
import Footer from './components/ui/Footer';
import Header from './components/ui/Header';
import Marquee from './components/ui/Marquee';
import { GenerationProvider } from './context/GenerationContext';
import AuthPage from './pages/AuthPage';
import GeneratePage from './pages/GeneratePage';
import HomePage from './pages/HomePage';
import LeaderboardPage from './pages/LeaderboardPage';
import LoadingPage from './pages/LoadingPage';
import MySongsPage from './pages/MySongsPage';
import PaymentSuccessPage from './pages/PaymentSuccessPage';
// import PaymentPage from './pages/PaymentPage'; // Eliminat Stripe
import ExemplePage from './pages/ExemplePage';
import ProfilePage from './pages/ProfilePage';
import ResultPage from './pages/ResultPage';
import TarifePage from './pages/TarifePage';
import './styles/App.css';

function App() {
  // Clear stale generation state on app startup
  useEffect(() => {
    const saved = localStorage.getItem('generationState');
    if (saved) {
      const parsed = JSON.parse(saved);
      // If there's stale generation state, clear it
      if (parsed.isGenerating) {
        localStorage.removeItem('generationState');
      }
    }
  }, []);

  return (
    <AuthProvider>
      <Router>
        <GenerationProvider>
          <div className="App">
            <Header />
            <Marquee />
            {/* <GenerationNotification /> */}
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
              <Route path="/my-songs" element={
                <ProtectedRoute>
                  <MySongsPage />
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
            <BottomMenu />
            <Footer />
          </div>
        </GenerationProvider>
      </Router>
    </AuthProvider>
  );
}

export default App;
