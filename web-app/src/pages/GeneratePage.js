import { doc, getDoc } from 'firebase/firestore';
import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { db } from 'services/firebase';
import { getStripe } from 'services/stripe';
import { useAuth } from '../components/auth/AuthContext';
import AuthModal from '../components/auth/AuthModal';
import { createGenerationRequest } from '../services/firebase/functions';
import '../styles/GeneratePage.css';
import '../styles/HomePage.css';

export default function GeneratePage() {
  const { user, isAuthenticated } = useAuth();
  const [selectedStyle, setSelectedStyle] = useState(null);
  const [fromName, setFromName] = useState('');
  const [toName, setToName] = useState('');
  const [dedication, setDedication] = useState('');
  const [songName, setSongName] = useState('');
  const [songDetails, setSongDetails] = useState('');
  const [wantsDedication, setWantsDedication] = useState(false);
  const [wantsDonation, setWantsDonation] = useState(false);
  const [donationAmount, setDonationAmount] = useState('');
  const [mode, setMode] = useState('hard');
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [userCredits, setUserCredits] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState(null);
  // Store generation params to use after auth
  const [pendingGenerationParams, setPendingGenerationParams] = useState(null);

  const navigate = useNavigate();
  const location = useLocation();
  
  // Set selected style from navigation state
  useEffect(() => {
    if (location.state?.selectedStyle) {
      setSelectedStyle(location.state.selectedStyle);
    }
  }, [location.state]);

  useEffect(() => {
    // Grab user credits
    if (user && isAuthenticated) {
      getDoc(doc(db, "usersPublic", user.uid)).then(userDoc => {
        setUserCredits(userDoc.data()?.numCredits ?? 0);
      });
    } else {
      setUserCredits(0);
    }
  }, [user, isAuthenticated]);

  const sendGenerationRequest = async () => {
    setIsProcessing(true);
    setError(null);
    try {
      const params = {
        style: selectedStyle,
        title: songName,
        from: fromName,
        to: toName,
        dedication,
        lyricsDetails: songDetails,
        wantsDedication,
        wantsDonation,
        donationAmount,
        mode
      };

      const response = await createGenerationRequest(params);
      console.log("response", response);
      
      if (response.paymentStatus === 'success') {
        // Generation started, go to loading page
        navigate('/result', { 
          state: { requestId: response.requestId, songId: null }
        });
      } else {
        if (response.sessionId) {
          // Need payment, redirect to Stripe
          const stripe = await getStripe();
          const { error } = await stripe.redirectToCheckout({ sessionId: response.sessionId });
          if (error) {
            setError('A apărut o eroare la plata. Încearcă din nou.');
          }
        } else {
          setError('A apărut o eroare. Încearcă din nou.');
        }
      }
    } catch (err) {
      console.error(err);
      setError('A apărut o eroare. Încearcă din nou.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleGenerateOrGoToPay = async () => {
    const params = {
      style: selectedStyle,
      title: songName,
      from: fromName,
      to: toName,
      dedication,
      lyricsDetails: songDetails,
      wantsDedication,
      wantsDonation,
      donationAmount,
      mode
    };

    if (!isAuthenticated) {
      // Store params and show auth modal
      setPendingGenerationParams(params);
      setShowAuthModal(true);
      return;
    }

    await sendGenerationRequest();
  };

  const handleAuthSuccess = async () => {
    // After successful auth, send the generation request if we have pending params
    if (pendingGenerationParams) {
      await sendGenerationRequest();
      setPendingGenerationParams(null);
    }
  };

  return (
    <div className="generate-page">
      {/* Hero Section */}
      <div className="hero-section">
        <div className="hero-card">
          <div className="hero-card-content">
            <h2 className="hero-title">Configureaza maneaua</h2>
            <p className="hero-subtitle">Genereaza-ti propria manea in cateva minute cu ajutorul aplicatiei noastre.</p>
          </div>
          <div className="hero-card-img">
            <div className="ellipse-bg"></div>
            <img src="/icons/Microphone.png" alt="Microfon" className="hero-icon" />
          </div>
        </div>
      </div>

      {/* Main Content Container */}
      <div className="main-content-container">
        {/* Modern Round Slider */}
        <div className="mode-slider-container">
          <div className="mode-slider">
            <button
              className={`mode-slider-option ${mode === 'easy' ? 'active' : ''}`}
              onClick={() => setMode('easy')}
            >
              <span className="mode-slider-text">Easy</span>
            </button>
            <button
              className={`mode-slider-option ${mode === 'hard' ? 'active' : ''}`}
              onClick={() => setMode('hard')}
            >
              <span className="mode-slider-text">Complex</span>
            </button>
          </div>
        </div>

        {/* Always visible - Nume piesă */}
        <div className="input-group">
          <label className="input-label">Titlu piesă</label>
          <input
            className="input"
            type="text"
            placeholder="Nume piesă"
            value={songName}
            onChange={(e) => setSongName(e.target.value)}
          />
        </div>

        {/* Complex mode fields */}
        {mode === 'hard' && (
          <>
            <div className="input-group">
              <label className="input-label">Detalii versuri</label>
              <input
                className="input"
                type="text"
                placeholder="Detalii versuri (ex: temă, atmosferă, poveste)"
                value={songDetails}
                onChange={(e) => setSongDetails(e.target.value)}
              />
            </div>

            <div className="checkbox-group">
              <input
                type="checkbox"
                checked={wantsDedication}
                onChange={(e) => setWantsDedication(e.target.checked)}
                id="dedication-checkbox"
              />
              <div className="checkbox-content">
                <label htmlFor="dedication-checkbox" className="checkbox-label">
                  Vrei dedicație?
                </label>
                <p className="checkbox-explanation">
                  Vrei sa dedici aceasta melodie unei persoane?
                </p>
              </div>
            </div>
            {wantsDedication && (
              <>
                <div className="input-group">
                  <label className="input-label">De la cine?</label>
                  <input
                    className="input"
                    type="text"
                    placeholder="De la cine?"
                    value={fromName}
                    onChange={(e) => setFromName(e.target.value)}
                  />
                </div>
                <div className="input-group">
                  <label className="input-label">Pentru cine?</label>
                  <input
                    className="input"
                    type="text"
                    placeholder="Pentru cine?"
                    value={toName}
                    onChange={(e) => setToName(e.target.value)}
                  />
                </div>
                <div className="input-group">
                  <label className="input-label">Dedicatie</label>
                  <input
                    className="input"
                    type="text"
                    placeholder="Dedicatie (opțional)"
                    value={dedication}
                    onChange={(e) => setDedication(e.target.value)}
                  />
                </div>
              </>
            )}
            <div className="checkbox-group">
              <input
                type="checkbox"
                checked={wantsDonation}
                onChange={(e) => setWantsDonation(e.target.checked)}
                id="donation-checkbox"
              />
              <div className="checkbox-content">
                <label htmlFor="donation-checkbox" className="checkbox-label">
                  Vrei să arunci cu bani?
                </label>
                <p className="checkbox-explanation">
                  Vrei sa mentionam cati bani ai aruncat?
                </p>
              </div>
            </div>
            {wantsDonation && (
              <div className="input-group">
                <label className="input-label">
                  Alege suma pe care vrei sa o arunci la manele si se va specifica in piesa (RON)
                </label>
                <input
                  className="input"
                  type="number"
                  placeholder="Ex: 100 RON"
                  value={donationAmount}
                  onChange={(e) => setDonationAmount(e.target.value)}
                />
              </div>
            )}
          </>
        )}

        {/* Buttons at the bottom */}
        <div className="buttons-container">
          <button className="hero-btn button generate-back-button" onClick={() => navigate('/select-style')}>
            <span className="hero-btn-text">Înapoi</span>
          </button>
          <button 
            className={`hero-btn button generate-button ${!songName.trim() || isProcessing ? 'disabled' : ''}`} 
            onClick={handleGenerateOrGoToPay}
            disabled={!songName.trim() || isProcessing}
          >
            <span className="hero-btn-text">
              {isProcessing ? 'Se procesează...' : userCredits > 0 ? 'Generează' : 'Plătește'}
            </span>
          </button>
        </div>

        {error && <div className="error-message">{error}</div>}

        {/* Auth Modal Component */}
        <AuthModal
          isOpen={showAuthModal}
          onClose={() => setShowAuthModal(false)}
          onSuccess={handleAuthSuccess}
        />
      </div>
    </div>
  );
} 