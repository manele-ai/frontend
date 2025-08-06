import { doc, getDoc } from 'firebase/firestore';
import { useCallback, useEffect, useState } from 'react';
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

// Constante pentru localStorage
const FORM_DATA_KEYS = {
  SELECTED_STYLE: 'generateForm_selectedStyle',
  SONG_NAME: 'generateForm_songName',
  SONG_DETAILS: 'generateForm_songDetails',
  WANTS_DEDICATION: 'generateForm_wantsDedication',
  FROM_NAME: 'generateForm_fromName',
  TO_NAME: 'generateForm_toName',
  DEDICATION: 'generateForm_dedication',
  WANTS_DONATION: 'generateForm_wantsDonation',
  DONOR_NAME: 'generateForm_donorName',
  DONATION_AMOUNT: 'generateForm_donationAmount',
  MODE: 'generateForm_mode',
  IS_ACTIVE: 'generateForm_isActive'
};

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

  // Funcții pentru persistența formularului
  const saveFormData = useCallback(() => {
    // Accesează direct state-urile curente pentru a evita problemele de closure
    const formData = {
      selectedStyle,
      songName,
      songDetails,
      wantsDedication,
      fromName,
      toName,
      dedication,
      wantsDonation,
      donorName,
      donationAmount,
      mode
    };
    
    Object.entries(formData).forEach(([key, value]) => {
      // Mapare corectă pentru chei camelCase la SCREAMING_SNAKE_CASE
      const keyMapping = {
        'selectedStyle': 'SELECTED_STYLE',
        'songName': 'SONG_NAME',
        'songDetails': 'SONG_DETAILS',
        'wantsDedication': 'WANTS_DEDICATION',
        'fromName': 'FROM_NAME',
        'toName': 'TO_NAME',
        'dedication': 'DEDICATION',
        'wantsDonation': 'WANTS_DONATION',
        'donorName': 'DONOR_NAME',
        'donationAmount': 'DONATION_AMOUNT',
        'mode': 'MODE'
      };
      
      const mappedKey = keyMapping[key];
      const storageKey = mappedKey ? FORM_DATA_KEYS[mappedKey] : undefined;
      
      if (storageKey) {
        // Pentru string-uri, nu mai facem JSON.stringify
        if (typeof value === 'string') {
          localStorage.setItem(storageKey, value);
        } else {
          localStorage.setItem(storageKey, JSON.stringify(value));
        }
      }
    });
    localStorage.setItem(FORM_DATA_KEYS.IS_ACTIVE, 'true');
  }, [songName, songDetails, wantsDedication, fromName, toName, dedication, wantsDonation, donorName, donationAmount, mode]);

  const loadFormData = useCallback(() => {
    const isActive = localStorage.getItem(FORM_DATA_KEYS.IS_ACTIVE) === 'true';
    
    if (!isActive) return false;
    
    try {
      // Funcție helper pentru încărcarea sigură
      const safeParse = (key, defaultValue) => {
        try {
          const value = localStorage.getItem(key);
          if (value === null || value === undefined) return defaultValue;
          
          // Pentru selectedStyle, tratează ca string dacă nu este JSON valid
          if (key === FORM_DATA_KEYS.SELECTED_STYLE) {
            try {
              return JSON.parse(value);
            } catch {
              // Dacă nu este JSON valid, tratează ca string
              return value;
            }
          }
          
          return JSON.parse(value);
        } catch (error) {
          console.warn(`Eroare la parsarea ${key}:`, error);
          return defaultValue;
        }
      };
      
      const safeGet = (key, defaultValue = '') => {
        const value = localStorage.getItem(key);
        return value !== null ? value : defaultValue;
      };
      
      const safeGetString = (key, defaultValue = '') => {
        const value = localStorage.getItem(key);
        return value !== null && value !== undefined ? value : defaultValue;
      };
      
      const loadedStyle = safeParse(FORM_DATA_KEYS.SELECTED_STYLE, null);
      const loadedSongName = safeGetString(FORM_DATA_KEYS.SONG_NAME, '');
      const loadedSongDetails = safeGetString(FORM_DATA_KEYS.SONG_DETAILS, '');
      const loadedWantsDedication = safeParse(FORM_DATA_KEYS.WANTS_DEDICATION, false);
      const loadedFromName = safeGetString(FORM_DATA_KEYS.FROM_NAME, '');
      const loadedToName = safeGetString(FORM_DATA_KEYS.TO_NAME, '');
      const loadedDedication = safeGetString(FORM_DATA_KEYS.DEDICATION, '');
      const loadedWantsDonation = safeParse(FORM_DATA_KEYS.WANTS_DONATION, false);
      const loadedDonorName = safeGetString(FORM_DATA_KEYS.DONOR_NAME, '');
      const loadedDonationAmount = safeGetString(FORM_DATA_KEYS.DONATION_AMOUNT, '');
      const loadedMode = safeGetString(FORM_DATA_KEYS.MODE, 'hard');
      

      
      setSelectedStyle(loadedStyle);
      setSongName(loadedSongName);
      setSongDetails(loadedSongDetails);
      setWantsDedication(loadedWantsDedication);
      setFromName(loadedFromName);
      setToName(loadedToName);
      setDedication(loadedDedication);
      setWantsDonation(loadedWantsDonation);
      setDonorName(loadedDonorName);
      setDonationAmount(loadedDonationAmount);
      setMode(loadedMode);
      
      return true;
    } catch (error) {
      console.error('Eroare la încărcarea datelor formularului:', error);
      return false;
    }
  }, []);

  const clearFormData = useCallback(() => {
    Object.values(FORM_DATA_KEYS).forEach(key => {
      localStorage.removeItem(key);
    });
  }, []);

  // Reset donation and dedication when switching to easy mode
  useEffect(() => {
    // Nu reseta datele dacă sunt încărcate din localStorage
    const isLoadedFromStorage = localStorage.getItem(FORM_DATA_KEYS.IS_ACTIVE) === 'true';
    const hasData = localStorage.getItem(FORM_DATA_KEYS.SONG_NAME) || 
                    localStorage.getItem(FORM_DATA_KEYS.SELECTED_STYLE) ||
                    localStorage.getItem(FORM_DATA_KEYS.SONG_DETAILS);
    
    if (mode === 'easy' && !isLoadedFromStorage && !hasData) {
      setWantsDedication(false);
      setWantsDonation(false);
      setDonationAmount('');
      setDonorName('');
      setFromName('');
      setToName('');
      setDedication('');
    }
  }, [mode]);

  // Încărcare date formular la mount
  useEffect(() => {
    const hasLoadedData = loadFormData();
    if (hasLoadedData) {
      // Marchează că datele au fost încărcate pentru a preveni resetarea
      localStorage.setItem(FORM_DATA_KEYS.IS_ACTIVE, 'true');
    }
  }, [loadFormData]);

  // Salvare automată pentru selectedStyle
  useEffect(() => {
    if (selectedStyle && selectedStyle !== null) {
      saveFormData();
    }
  }, [selectedStyle, saveFormData]);

  // Salvare automată a datelor formularului
  useEffect(() => {
    // Salvează doar dacă există date reale (nu doar valori default)
    const hasRealData = (songName && songName.trim()) || 
                       (songDetails && songDetails.trim()) ||
                       wantsDedication || 
                       wantsDonation ||
                       (fromName && fromName.trim()) ||
                       (toName && toName.trim()) ||
                       (dedication && dedication.trim()) ||
                       (donorName && donorName.trim()) ||
                       (donationAmount && donationAmount.trim());
    
    if (hasRealData) {
      saveFormData();
    }
  }, [songName, songDetails, wantsDedication, fromName, toName, dedication, wantsDonation, donorName, donationAmount, mode, saveFormData]);

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
        
        // Șterge datele formularului când generarea începe cu succes
        clearFormData();
        
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
        <div className="hero-card">
          <div className="hero-card-content">
            <h2 className="hero-title">Configureaza maneaua</h2>
            <p className="hero-subtitle">Genereaza-ti propria manea in cateva minute cu ajutorul aplicatiei noastre.</p>
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