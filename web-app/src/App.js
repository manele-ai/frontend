import { Route, BrowserRouter as Router, Routes } from 'react-router-dom';
import { AuthProvider } from './components/auth/AuthContext';
import ProtectedRoute from './components/auth/ProtectedRoute';
import Header from './components/ui/Header';
import AuthPage from './pages/AuthPage';
import HomePage from './pages/HomePage';
import LeaderboardPage from './pages/LeaderboardPage';
import LoadingPage from './pages/LoadingPage';
import MySongsPage from './pages/MySongsPage';
// import PaymentPage from './pages/PaymentPage'; // Eliminat Stripe
import BottomMenu from './components/ui/BottomMenu';
import ExemplePage from './pages/ExemplePage';
import GeneratePage from './pages/GeneratePage';
import ProfilePage from './pages/ProfilePage';
import ResultPage from './pages/ResultPage';
import SelectStylePage from './pages/SelectStylePage';
import './styles/App.css';

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="App">
          <Header />
          <Routes>
            {/* Public routes */}
            <Route path="/auth" element={<AuthPage />} />
            <Route path="/" element={<HomePage />} />
            <Route path="/exemple" element={<ExemplePage />} />
            <Route path="/select-style" element={<SelectStylePage />} />
            <Route path="/generate" element={<GeneratePage />} />
            <Route path="/leaderboard" element={<LeaderboardPage />} />
            
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
            {/* <Route path="/pay" element={
              <ProtectedRoute>
                <PaymentPage />
              </ProtectedRoute>
            } /> */}
          </Routes>
          <BottomMenu />
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;
