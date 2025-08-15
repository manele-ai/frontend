import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../components/auth/AuthContext';
import ComplexModeForm from '../components/ComplexModeForm';
import EasyModeForm from '../components/EasyModeForm';
import { useGlobalSongStatus } from '../hooks/useGlobalSongStatus';
import '../styles/GeneratePage.css';

export default function GeneratePage() {
  const [mode, setMode] = useState('hard');
  const [isChecking, setIsChecking] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();
  const { isGenerationActive, activeRequestId, hasTimedOut } = useGlobalSongStatus();
  const { user, isAuthenticated } = useAuth();
  const [userCredits, setUserCredits] = useState(0);
  
  // Get pre-selected style from navigation state
  const preSelectedStyle = location.state?.selectedStyle;
  const fromHomePage = location.state?.fromHomePage;

  // Check for active generation on component mount and redirect if needed
  useEffect(() => {
    const checkAndRedirect = () => {
      // Nu e necesar, dar sa fim siguri
      if (hasTimedOut) {
        setIsChecking(false);
        return;
      }
      
      if (isGenerationActive()) {
        // Navigate to result page with the active request ID
        const savedRequestId = localStorage.getItem('activeGenerationRequestId');
        const requestIdToUse = activeRequestId || savedRequestId;
        
        if (requestIdToUse) {
          navigate('/result', { 
            state: { requestId: requestIdToUse },
            replace: true // Replace current entry in history to prevent back navigation loops
          });
          return;
        }
      }
      // If no active generation, allow the component to render
      setIsChecking(false);
    };

    // Check immediately
    checkAndRedirect();
  }, [isGenerationActive, activeRequestId, hasTimedOut, navigate]);

  // Load user credits for display in Generate page header
  useEffect(() => {
    if (user && isAuthenticated) {
      import('firebase/firestore').then(({ getDoc, doc }) => {
        import('../services/firebase').then(({ db }) => {
          // Align with ProfilePage: read from 'usersPublic' for authoritative, up-to-date data
          getDoc(doc(db, 'usersPublic', user.uid))
            .then((userDoc) => {
              setUserCredits(userDoc.data()?.creditsBalance ?? 0);
            })
            .catch(() => setUserCredits(0));
        });
      });
    } else {
      setUserCredits(0);
    }
  }, [user, isAuthenticated]);

  const handleBack = () => {
    navigate('/');
  };

  // Show minimal loading div while checking to prevent flash
  if (isChecking) {
    return (
      <div 
        className="generate-page"
        style={{
          backgroundSize: '30%',
          backgroundPosition: '0 0',
          backgroundRepeat: 'repeat',
          minHeight: '100vh'
        }}
      >
      </div>
    );
  }

  return (
    <div 
      className="generate-page"
      style={{
        backgroundImage: 'url(/backgrounds/patternFudalSecond.svg)',
        backgroundSize: '30%',
        backgroundPosition: '0 0',
        backgroundRepeat: 'repeat',
      }}
    >
      {/* Hero Section */}
      <div className="hero-section">
        <div className="hero-card">
          <div className="hero-card-content">
            <h2 className="hero-title">FĂ-ȚI MANEAUA MAI JOS!</h2>
            <p className="hero-subtitle">Creează-ți manea completând formularul de mai jos.</p>
          </div>
        </div>
      </div>

      {/* Main Content Container */}
      <div className="main-content-container">
        {/* Credits badge above mode selector */}
        <div className="credits-badge-container">
          <div className="credits-badge" title="Le poti folosi oricand in aplicatie">
            <span className="credits-badge-label">Credite piese:</span>
            <span className="credits-badge-value">{userCredits}</span>
          </div>
        </div>
        {/* Mode Slider */}
        <div className="mode-slider-container">
          <div className="mode-slider">
            <button
              className={`mode-slider-option ${mode === 'hard' ? 'active' : ''}`}
              onClick={() => setMode('hard')}
            >
              <span className="mode-slider-text">Detaliat</span>
            </button>
            <button
              className={`mode-slider-option ${mode === 'easy' ? 'active' : ''}`}
              onClick={() => setMode('easy')}
            >
              <span className="mode-slider-text">Ușor</span>
            </button>
          </div>
        </div>

        {/* Render appropriate form based on mode */}
        {mode === 'easy' ? (
          <EasyModeForm onBack={handleBack} preSelectedStyle={preSelectedStyle} />
        ) : (
          <ComplexModeForm onBack={handleBack} preSelectedStyle={preSelectedStyle} />
        )}
      </div>
    </div>
  );
} 