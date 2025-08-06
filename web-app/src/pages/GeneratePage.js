import { doc, getDoc } from 'firebase/firestore';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth, db } from 'services/firebase';
import { getStripe } from 'services/stripe';
import { useAuth } from '../components/auth/AuthContext';
import AuthModal from '../components/auth/AuthModal';
import { useNotification } from '../context/NotificationContext';

import { styles } from '../data/stylesData';
import { createGenerationRequest } from '../services/firebase/functions';
import '../styles/GeneratePage.css';
import '../styles/HomePage.css';

export default function GeneratePage() {
  const { user, isAuthenticated, waitForUserDocCreation } = useAuth();
  const { showNotification } = useNotification();

  const [selectedStyle, setSelectedStyle] = useState(null);
  const [fromName, setFromName] = useState('');
  const [toName, setToName] = useState('');
  const [dedication, setDedication] = useState('');
  const [songName, setSongName] = useState('');
  const [songDetails, setSongDetails] = useState('');
  const [wantsDedication, setWantsDedication] = useState(false);
  const [wantsDonation, setWantsDonation] = useState(false);
  const [donationAmount, setDonationAmount] = useState('');
  const [donorName, setDonorName] = useState('');
  const [mode, setMode] = useState('hard');
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [userCredits, setUserCredits] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState(null);
  const [fieldErrors, setFieldErrors] = useState({
    style: '',
    songName: '',
    fromName: '',
    toName: '',
    dedication: '',
    donorName: '',
    donationAmount: ''
  });
  const [hasAttemptedSubmit, setHasAttemptedSubmit] = useState(false);
  // Store generation params to use after auth
  const [pendingGenerationParams, setPendingGenerationParams] = useState(null);

  const navigate = useNavigate();

  // Reset donation and dedication when switching to easy mode
  useEffect(() => {
    if (mode === 'easy') {
      setWantsDedication(false);
      setWantsDonation(false);
      setDonationAmount('');
      setDonorName('');
      setFromName('');
      setToName('');
      setDedication('');
    }
  }, [mode]);

  useEffect(() => {
    // Grab user credits
    if (user && isAuthenticated) {
      getDoc(doc(db, "usersPublic", user.uid)).then(userDoc => {
        setUserCredits(userDoc.data()?.creditsBalance ?? 0);
      });
    } else {
      setUserCredits(0);
    }
  }, [user, isAuthenticated]);

  // Actualizează erorile câmpurilor doar după prima încercare de generare
  useEffect(() => {
    if (!hasAttemptedSubmit) {
      return;
    }

    const newErrors = {
      style: !selectedStyle ? 'Te rugăm să selectezi un stil.' : '',
      songName: !songName.trim() ? 'Te rugăm să introduci numele piesei.' : '',
      fromName: wantsDedication && !fromName.trim() ? 'Te rugăm să introduci numele celui care dedică.' : '',
      toName: wantsDedication && !toName.trim() ? 'Te rugăm să introduci numele celui căruia i se dedică.' : '',
      dedication: wantsDedication && !dedication.trim() ? 'Te rugăm să introduci textul dedicației.' : '',
      donorName: wantsDonation && !donorName.trim() ? 'Te rugăm să introduci numele celui care aruncă cu bani.' : '',
      donationAmount: ''
    };

    // Validare specială pentru suma donației
    if (wantsDonation && donationAmount.trim()) {
      const amount = parseInt(donationAmount);
      if (amount < 10) {
        newErrors.donationAmount = 'Suma trebuie să fie cel puțin 10 RON.';
      } else if (amount % 10 !== 0) {
        newErrors.donationAmount = 'Suma trebuie să fie multiplu de 10 (ex: 10, 20, 30, etc.).';
      }
    } else if (wantsDonation && !donationAmount.trim()) {
      newErrors.donationAmount = 'Te rugăm să introduci suma donației.';
    }

    setFieldErrors(newErrors);
  }, [hasAttemptedSubmit, selectedStyle, songName, wantsDedication, wantsDonation, fromName, toName, dedication, donorName, donationAmount]);

  // Calculate price based on mode and options
  const calculatePrice = () => {
    let basePrice = 29.99;
    
    // If complex mode and dedication is checked, add 30 RON
    if (mode === 'hard' && wantsDedication) {
      basePrice += 30;
    }
    
    // If donation is checked, add the donation amount
    if (wantsDonation && donationAmount) {
      basePrice += parseFloat(donationAmount) || 0;
    }
    
    return basePrice;
  };

  const finalPrice = calculatePrice();

  // Funcție pentru a valida și formata suma donației
  const handleDonationAmountChange = (e) => {
    const value = e.target.value;
    
    // Permite doar numere întregi și câmpul gol
    if (value === '' || /^\d+$/.test(value)) {
      setDonationAmount(value);
    }
  };

  // Funcție pentru a reseta erorile când utilizatorul începe să completeze
  const resetErrors = () => {
    if (hasAttemptedSubmit) {
      setHasAttemptedSubmit(false);
      setFieldErrors({
        style: '',
        songName: '',
        fromName: '',
        toName: '',
        dedication: '',
        donorName: '',
        donationAmount: ''
      });
    }
  };



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
        donorName,
        mode
      };

      const response = await createGenerationRequest(params);
      
      if (response.paymentStatus === 'success') {
        console.log('[NOTIF-DEBUG] GenPage: Creare notificare loading cu requestId:', response.requestId);
        // Show loading notification with requestId
        const notificationId = showNotification({
          type: 'loading',
          title: 'Se generează maneaua...',
          message: 'AI-ul compune melodia ta personalizată.',
          duration: 'manual',
          requestId: response.requestId // Store requestId for global monitoring
        });
        console.log('[NOTIF-DEBUG] GenPage: Notificare loading creată cu id:', notificationId);
        
        // Save requestId separately for persistence across redirects
        localStorage.setItem('activeGenerationRequestId', response.requestId);
        console.log('[NOTIF-DEBUG] GenPage: requestId salvat în localStorage:', response.requestId);
        
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
            showNotification({
              type: 'error',
              title: 'Eroare la plată',
              message: 'A apărut o eroare la plata. Încearcă din nou.',
              duration: 30000
            });
            setError('A apărut o eroare la plata. Încearcă din nou.');
          }
        } else {
          showNotification({
            type: 'error',
            title: 'Eroare la generare',
            message: 'A apărut o eroare. Încearcă din nou.',
            duration: 30000
          });
          setError('A apărut o eroare. Încearcă din nou.');
        }
      }
    } catch (err) {
      console.error(err);
      showNotification({
        type: 'error',
        title: 'Eroare la generare',
        message: 'A apărut o eroare. Încearcă din nou.',
        duration: 30000
      });
      setError('A apărut o eroare. Încearcă din nou.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleGenerateOrGoToPay = async () => {
    // Marchează că s-a încercat generarea pentru a afișa erorile
    setHasAttemptedSubmit(true);

    // Verifică validările
    const basicValidation = !selectedStyle || !songName.trim();
    const dedicationValidation = wantsDedication && (!fromName.trim() || !toName.trim() || !dedication.trim());
    const donationValidation = wantsDonation && (
      !donorName.trim() || 
      !donationAmount.trim() || 
      (donationAmount.trim() && (parseInt(donationAmount) % 10 !== 0 || parseInt(donationAmount) < 10))
    );

    const hasValidationErrors = basicValidation || dedicationValidation || donationValidation;

    // Dacă sunt erori de validare, nu continua cu plata
    if (hasValidationErrors) {
      return;
    }

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
      donorName,
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
    if (pendingGenerationParams) {
      try {
        console.log('waitForUserDocCreation');
        const userDocCreated = await waitForUserDocCreation(10000);
        console.log('userDocCreated', userDocCreated);
        if (!userDocCreated) {
          setError('A apărut o eroare la autentificare. Te rugăm să încerci din nou.');
          return;
        }

        const currentUser = auth.currentUser;
        if (currentUser) {
          await sendGenerationRequest();
          setPendingGenerationParams(null);
        } else {
          setError('Autentificarea nu s-a finalizat corect. Te rugăm să încerci din nou.');
        }
      } catch (error) {
        setError('A apărut o eroare la autentificare. Te rugăm să încerci din nou.');
      }
    }
  };

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
        <div className="hero-section-overlay"></div>
        <div className="hero-card">
          <div className="hero-card-content">
            <h2 className="hero-title">Configureaza maneaua</h2>
            <p className="hero-subtitle">Genereaza-ti propria manea in cateva minute cu ajutorul aplicatiei noastre.</p>
          </div>
          <div className="hero-card-img">
            <div className="hero-image-overlay"></div>
          </div>
        </div>
      </div>

      {/* Main Content Container */}
      <div className="main-content-container">
        {/* Style Selection */}
        <div className="style-selection-container">
          <label className="input-label">Alege stilul</label>
          <div className="style-cards-grid">
            {styles.map((style) => (
                              <div
                  key={style.value}
                  className={`style-mini-card ${selectedStyle === style.value ? 'selected' : ''}`}
                  onClick={() => {
                    setSelectedStyle(style.value);
                    resetErrors();
                  }}
                >
                <div className="style-mini-card-title">{style.title}</div>
              </div>
            ))}
          </div>
          {fieldErrors.style && <div className="field-error">{fieldErrors.style}</div>}
        </div>

        {/* Modern Round Slider */}
        <div className="mode-slider-container">
          <div className="mode-slider">
            <button
              className={`mode-slider-option ${mode === 'hard' ? 'active' : ''}`}
              onClick={() => setMode('hard')}
            >
              <span className="mode-slider-text">Complex</span>
            </button>
            <button
              className={`mode-slider-option ${mode === 'easy' ? 'active' : ''}`}
              onClick={() => setMode('easy')}
            >
              <span className="mode-slider-text">Easy</span>
            </button>
          </div>
        </div>

        {/* Always visible - Nume piesă */}
        <div className="input-group">
          <label className="input-label">Titlu piesă</label>
          <input
            className={`input ${fieldErrors.songName ? 'error' : ''}`}
            type="text"
            placeholder="Nume piesă"
            value={songName}
            onChange={(e) => {
              setSongName(e.target.value);
              resetErrors();
            }}
          />
          {fieldErrors.songName && <div className="field-error">{fieldErrors.songName}</div>}
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
              <div className="checkbox-content">
                <label className="checkbox-label">
                  Vrei dedicație?
                </label>
                <p className="checkbox-explanation">
                  Vrei sa dedici aceasta melodie unei persoane?
                </p>
              </div>
              <div className="checkbox-slider-container">
                <div className="checkbox-slider">
                  <button
                    className={`checkbox-slider-option ${!wantsDedication ? 'active' : ''}`}
                    onClick={() => {
                      setWantsDedication(false);
                      resetErrors();
                    }}
                  >
                    <span className="checkbox-slider-text">Nu</span>
                  </button>
                  <button
                    className={`checkbox-slider-option ${wantsDedication ? 'active' : ''}`}
                    onClick={() => {
                      setWantsDedication(true);
                      resetErrors();
                    }}
                  >
                    <span className="checkbox-slider-text">Da</span>
                  </button>
                </div>
              </div>
            </div>
            {wantsDedication && (
              <>
                <div className="input-group">
                  <label className="input-label">De la cine?</label>
                  <input
                    className={`input ${fieldErrors.fromName ? 'error' : ''}`}
                    type="text"
                    placeholder="De la cine?"
                    value={fromName}
                    onChange={(e) => {
                      setFromName(e.target.value);
                      resetErrors();
                    }}
                  />
                  {fieldErrors.fromName && <div className="field-error">{fieldErrors.fromName}</div>}
                </div>
                <div className="input-group">
                  <label className="input-label">Pentru cine?</label>
                  <input
                    className={`input ${fieldErrors.toName ? 'error' : ''}`}
                    type="text"
                    placeholder="Pentru cine?"
                    value={toName}
                    onChange={(e) => {
                      setToName(e.target.value);
                      resetErrors();
                    }}
                  />
                  {fieldErrors.toName && <div className="field-error">{fieldErrors.toName}</div>}
                </div>
                <div className="input-group">
                  <label className="input-label">Dedicatie</label>
                  <input
                    className={`input ${fieldErrors.dedication ? 'error' : ''}`}
                    type="text"
                    placeholder="Dedicatie (opțional)"
                    value={dedication}
                    onChange={(e) => {
                      setDedication(e.target.value);
                      resetErrors();
                    }}
                  />
                  {fieldErrors.dedication && <div className="field-error">{fieldErrors.dedication}</div>}
                </div>
              </>
            )}
            <div className="checkbox-group">
              <div className="checkbox-content">
                <label className="checkbox-label">
                  Vrei să arunci cu bani?
                </label>
                <p className="checkbox-slider-explanation">
                  Vrei sa mentionam cati bani ai aruncat?
                </p>
              </div>
              <div className="checkbox-slider-container">
                <div className="checkbox-slider">
                  <button
                    className={`checkbox-slider-option ${!wantsDonation ? 'active' : ''}`}
                    onClick={() => {
                      setWantsDonation(false);
                      resetErrors();
                    }}
                  >
                    <span className="checkbox-slider-text">Nu</span>
                  </button>
                  <button
                    className={`checkbox-slider-option ${wantsDonation ? 'active' : ''}`}
                    onClick={() => {
                      setWantsDonation(true);
                      resetErrors();
                    }}
                  >
                    <span className="checkbox-slider-text">Da</span>
                  </button>
                </div>
              </div>
            </div>
            {wantsDonation && (
              <div className="input-group">
                <label className="input-label">Numele celui care aruncă cu bani</label>
                <input
                  className={`input ${fieldErrors.donorName ? 'error' : ''}`}
                  type="text"
                  placeholder="Ex: Gheorghiță Varicelă"
                  value={donorName}
                  onChange={(e) => {
                    setDonorName(e.target.value);
                    resetErrors();
                  }}
                />
                {fieldErrors.donorName && <div className="field-error">{fieldErrors.donorName}</div>}
              </div>
            )}
            {wantsDonation && (
              <div className="input-group">
                <label className="input-label">
                  Alege suma pe care vrei sa o arunci la manele si se va specifica in piesa (RON)
                </label>
                <input
                  className={`input ${fieldErrors.donationAmount ? 'error' : ''}`}
                  type="number"
                  placeholder="Ex: 100 RON (doar multipli de 10)"
                  value={donationAmount}
                  onChange={(e) => {
                    handleDonationAmountChange(e);
                    resetErrors();
                  }}
                  min="10"
                  step="1"
                />
                {fieldErrors.donationAmount && <div className="field-error">{fieldErrors.donationAmount}</div>}
              </div>
            )}
          </>
        )}

        {/* Price Display */}
        <div className="price-container-wrapper">
        <div className="price-container">
          <div className="price-card">
            <h3 className="price-title">Preț final</h3>
            <div className="price-amount">
              <span className="price-value">{finalPrice.toFixed(2)}</span>
              <span className="price-currency">RON</span>
            </div>
              {mode === 'hard' && wantsDedication && (
                <div className="price-item">
                  <span className="price-item-label">Dedicație:</span>
                  <span className="price-item-value">+30.00 RON</span>
                </div>
              )}
              {wantsDonation && donationAmount && (
                <div className="price-item">
                  <span className="price-item-label">Aruncat cu bani:</span>
                  <span className="price-item-value">+{parseFloat(donationAmount) || 0} RON</span>
                </div>
              )}
            <div className="price-breakdown">
              <div className="price-item">
                <span className="price-item-label">Preț de bază:</span>
                <span className="price-item-value">29.99 RON</span>
              </div>
            </div>
          </div>
        </div>
        </div>

        {/* Buttons at the bottom */}
        <div className="buttons-container">
          <button className="hero-btn button generate-back-button" onClick={() => navigate('/')}>
            <span className="hero-btn-text">Înapoi</span>
          </button>
          {(() => {
            // Validare de bază
            const basicValidation = !selectedStyle || !songName.trim() || isProcessing;
            
            // Validare pentru dedicație
            const dedicationValidation = wantsDedication && (!fromName.trim() || !toName.trim() || !dedication.trim());
            
            // Validare pentru donație
            const donationValidation = wantsDonation && (
              !donorName.trim() || 
              !donationAmount.trim() || 
              (donationAmount.trim() && (parseInt(donationAmount) % 10 !== 0 || parseInt(donationAmount) < 10))
            );
            
            const hasValidationErrors = basicValidation || dedicationValidation || donationValidation;
            
            return (
              <button 
                className="hero-btn button generate-button" 
                onClick={() => {
                  handleGenerateOrGoToPay();
                }}
                disabled={isProcessing}
              >
                <span className="hero-btn-text">
                  {isProcessing ? 'Se procesează...' : userCredits > 0 ? 'Generează' : 'Plătește'}
                </span>
              </button>
            );
          })()}
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