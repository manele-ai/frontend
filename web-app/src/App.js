import { Route, BrowserRouter as Router, Routes } from 'react-router-dom';
import { AuthProvider } from './components/auth/AuthContext';
import ProtectedRoute from './components/auth/ProtectedRoute';
import BottomMenu from './components/ui/BottomMenu';
import Header from './components/ui/Header';
import AuthPage from './pages/AuthPage';
import GeneratePage from './pages/GeneratePage';
import HomePage from './pages/HomePage';
import LeaderboardPage from './pages/LeaderboardPage';
import LoadingPage from './pages/LoadingPage';
import MySongsPage from './pages/MySongsPage';
import PaymentPage from './pages/PaymentPage';
import PaymentSuccessPage from './pages/PaymentSuccessPage';
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
            <Route path="/payment" element={
              <ProtectedRoute>
                <PaymentPage />
              </ProtectedRoute>
            } />
            <Route path="/payment-success" element={
              <ProtectedRoute>
                <PaymentSuccessPage />
              </ProtectedRoute>
            } />
          </Routes>
          <BottomMenu />
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;
