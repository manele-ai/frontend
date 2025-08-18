import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useNotification } from '../context/NotificationContext';
import { styles } from '../data/stylesData';
import { createGenerationRequest } from '../services/firebase/functions';
import '../styles/GeneratePage.css';
import { useAuth } from './auth/AuthContext';
import AuthModal from './auth/AuthModal';
import LazyAudioPlayer from './LazyAudioPlayer';

// Constante pentru localStorage - Complex Mode
const COMPLEX_FORM_DATA_KEYS = {
  SELECTED_STYLE: 'complexForm_selectedStyle',
  SONG_NAME: 'complexForm_songName',
  SONG_DETAILS: 'complexForm_songDetails',
  WANTS_DEDICATION: 'complexForm_wantsDedication',
  FROM_NAME: 'complexForm_fromName',
  TO_NAME: 'complexForm_toName',
  DEDICATION: 'complexForm_dedication',
  WANTS_DONATION: 'complexForm_wantsDonation',
  DONOR_NAME: 'complexForm_donorName',
  DONATION_AMOUNT: 'complexForm_donationAmount',
  IS_ACTIVE: 'complexForm_isActive'
};

// Exemple de piese pentru serviciile de dedicație și donație
const EXAMPLE_SONGS = {
  dedication: {
    id: 'dedication-example',
    apiData: {
      title: 'Dedicație pentru Liviu',
      imageUrl: '/photos/Petrecere.jpeg',
      audioUrl: '/music/dedicatie-example.mp4'
    },
    storage: { url: '/music/dedication-example.mp4' }
  },
  aruncaCuBani: {
    id: 'arunca-cu-bani-example',
    apiData: {
      title: 'Aruncat cu 100 RON',
      imageUrl: '/photos/Comerciale.jpeg',
      audioUrl: '/music/arunca-cu-bani-example.mp4'
    },
    storage: { url: '/music/arunca-cu-bani-example.mp4' }
  }
};

export default function ComplexModeForm({ onBack, preSelectedStyle }) {
  const { user, isAuthenticated, waitForUserDocCreation } = useAuth();
  const { showNotification } = useNotification();
  const navigate = useNavigate();

  // State pentru Complex Mode
  const [selectedStyle, setSelectedStyle] = useState(preSelectedStyle || null);
  const [songName, setSongName] = useState('');
  const [songDetails, setSongDetails] = useState('');
  const [wantsDedication, setWantsDedication] = useState(false);
  const [fromName, setFromName] = useState('');
  const [toName, setToName] = useState('');
  const [dedication, setDedication] = useState('');
  const [wantsDonation, setWantsDonation] = useState(false);
  const [donorName, setDonorName] = useState('');
  const [donationAmount, setDonationAmount] = useState('');
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
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [userCredits, setUserCredits] = useState(0);
  const [pendingGenerationParams, setPendingGenerationParams] = useState(null);
  
  // State pentru player-ele de exemplu
  const [activeDedicationPlayer, setActiveDedicationPlayer] = useState(false);
  const [activeDonationPlayer, setActiveDonationPlayer] = useState(false);

  // Funcții pentru persistența formularului
  const saveFormData = useCallback(() => {
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
      donationAmount
    };
    
    Object.entries(formData).forEach(([key, value]) => {
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
        'donationAmount': 'DONATION_AMOUNT'
      };
      
      const mappedKey = keyMapping[key];
      const storageKey = mappedKey ? COMPLEX_FORM_DATA_KEYS[mappedKey] : undefined;
      
      if (storageKey) {
        if (typeof value === 'string') {
          localStorage.setItem(storageKey, value);
        } else {
          localStorage.setItem(storageKey, JSON.stringify(value));
        }
      }
    });
    localStorage.setItem(COMPLEX_FORM_DATA_KEYS.IS_ACTIVE, 'true');
  }, [selectedStyle, songName, songDetails, wantsDedication, fromName, toName, dedication, wantsDonation, donorName, donationAmount]);

  const loadFormData = useCallback(() => {
    const isActive = localStorage.getItem(COMPLEX_FORM_DATA_KEYS.IS_ACTIVE) === 'true';
    
    if (!isActive) return false;
    
    try {
      const safeParse = (key, defaultValue) => {
        try {
          const value = localStorage.getItem(key);
          if (value === null || value === undefined) return defaultValue;
          
          if (key === COMPLEX_FORM_DATA_KEYS.SELECTED_STYLE) {
            try {
              return JSON.parse(value);
            } catch {
              return value;
            }
          }
          
          return JSON.parse(value);
        } catch (error) {
          console.warn(`Eroare la parsarea ${key}:`, error);
          return defaultValue;
        }
      };
      
      const safeGetString = (key, defaultValue = '') => {
        const value = localStorage.getItem(key);
        return value !== null && value !== undefined ? value : defaultValue;
      };
      
      const loadedStyle = safeParse(COMPLEX_FORM_DATA_KEYS.SELECTED_STYLE, null);
      const loadedSongName = safeGetString(COMPLEX_FORM_DATA_KEYS.SONG_NAME, '');
      const loadedSongDetails = safeGetString(COMPLEX_FORM_DATA_KEYS.SONG_DETAILS, '');
      const loadedWantsDedication = safeParse(COMPLEX_FORM_DATA_KEYS.WANTS_DEDICATION, false);
      const loadedFromName = safeGetString(COMPLEX_FORM_DATA_KEYS.FROM_NAME, '');
      const loadedToName = safeGetString(COMPLEX_FORM_DATA_KEYS.TO_NAME, '');
      const loadedDedication = safeGetString(COMPLEX_FORM_DATA_KEYS.DEDICATION, '');
      const loadedWantsDonation = safeParse(COMPLEX_FORM_DATA_KEYS.WANTS_DONATION, false);
      const loadedDonorName = safeGetString(COMPLEX_FORM_DATA_KEYS.DONOR_NAME, '');
      const loadedDonationAmount = safeGetString(COMPLEX_FORM_DATA_KEYS.DONATION_AMOUNT, '');
      
            // Verifică dacă există date reale pentru a încărca
      const hasRealData = loadedStyle || 
                         (loadedSongName && loadedSongName.trim()) ||
                         (loadedSongDetails && loadedSongDetails.trim()) ||
                         (loadedWantsDedication && (loadedFromName && loadedFromName.trim() && loadedToName && loadedToName.trim() && loadedDedication && loadedDedication.trim())) ||
                         (loadedWantsDonation && (loadedDonorName && loadedDonorName.trim() && loadedDonationAmount && loadedDonationAmount.trim())) ||
                         (loadedFromName && loadedFromName.trim()) ||
                         (loadedToName && loadedToName.trim()) ||
                         (loadedDedication && loadedDedication.trim()) ||
                         (loadedDonorName && loadedDonorName.trim()) ||
                         (loadedDonationAmount && loadedDonationAmount.trim());
      
      if (!hasRealData) {
        // Dacă nu există date reale, șterge IS_ACTIVE și nu încărca nimic
        localStorage.removeItem(COMPLEX_FORM_DATA_KEYS.IS_ACTIVE);
        return false;
      }
      
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
      
      return true;
    } catch (error) {
      console.error('Eroare la încărcarea datelor formularului:', error);
      return false;
    }
  }, []);

  const clearFormData = useCallback(() => {
    Object.values(COMPLEX_FORM_DATA_KEYS).forEach(key => {
      localStorage.removeItem(key);
    });
  }, []);

  // Load user credits
  useEffect(() => {
    if (user && isAuthenticated) {
      import('firebase/firestore').then(({ getDoc, doc }) => {
        import('../services/firebase').then(({ db }) => {
          // Align with ProfilePage: read from 'usersPublic' for up-to-date credits
          getDoc(doc(db, "usersPublic", user.uid)).then(userDoc => {
            setUserCredits(userDoc.data()?.creditsBalance ?? 0);
          });
        });
      });
    } else {
      setUserCredits(0);
    }
  }, [user, isAuthenticated]);

  // State pentru a ține evidența dacă datele au fost încărcate din localStorage
  const [dataLoadedFromStorage, setDataLoadedFromStorage] = useState(false);

  // Încărcare date formular la mount
  useEffect(() => {
    const wasLoaded = loadFormData();
    setDataLoadedFromStorage(wasLoaded);
  }, [loadFormData]);

  // Salvare automată pentru selectedStyle (doar dacă nu au fost încărcate din storage)
  useEffect(() => {
    if (selectedStyle && selectedStyle !== null && !dataLoadedFromStorage) {
      saveFormData();
    }
  }, [selectedStyle, saveFormData, dataLoadedFromStorage]);

  // Salvare automată a datelor formularului (doar dacă nu au fost încărcate din storage)
  useEffect(() => {
    const hasRealData = (songName && songName.trim()) || 
                       (songDetails && songDetails.trim()) ||
                       (wantsDedication && (fromName && fromName.trim() && toName && toName.trim() && dedication && dedication.trim())) ||
                       (wantsDonation && (donorName && donorName.trim() && donationAmount && donationAmount.trim())) ||
                       (fromName && fromName.trim()) ||
                       (toName && toName.trim()) ||
                       (dedication && dedication.trim()) ||
                       (donorName && donorName.trim()) ||
                       (donationAmount && donationAmount.trim());
    
    if (hasRealData && !dataLoadedFromStorage) {
      saveFormData();
    }
  }, [songName, songDetails, wantsDedication, wantsDonation, fromName, toName, dedication, donorName, donationAmount, saveFormData, dataLoadedFromStorage]);

  // Update field errors
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
      if (amount < 0) {
        newErrors.donationAmount = 'Suma trebuie să fie mai mare de 0 RON';
      }
    } else if (wantsDonation && !donationAmount.trim()) {
      newErrors.donationAmount = 'Introdu câți bani vrei să dai la dedicație.';
    }

    setFieldErrors(newErrors);
  }, [hasAttemptedSubmit, selectedStyle, songName, wantsDedication, wantsDonation, fromName, toName, dedication, donorName, donationAmount]);

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

  const scrollToFirstError = () => {
    setTimeout(() => {
      const errorElements = document.querySelectorAll('.field-error');
      for (let i = 0; i < errorElements.length; i++) {
        const el = errorElements[i];
        if (el && el.textContent && el.textContent.trim()) {
          el.scrollIntoView({ behavior: 'smooth', block: 'center' });
          break;
        }
      }
    }, 50);
  };
  
  const handleDonationAmountChange = (e) => {
    const value = e.target.value;
    
    // Permite doar numere întregi și câmpul gol
    if (value === '' || /^\d+$/.test(value)) {
      setDonationAmount(value);
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
        mode: 'hard'
      };

      const response = await createGenerationRequest(params);
      
      if (response.paymentStatus === 'success') {
        console.log('[NOTIF-DEBUG] ComplexMode: Creare notificare loading cu requestId:', response.requestId);
        
        // Șterge datele formularului când generarea începe cu succes
        clearFormData();
        
        // Show loading notification with requestId
        const notificationId = showNotification({
          type: 'loading',
          title: 'Se generează maneaua...',
          message: 'AI-ul compune melodia ta personalizată.',
          duration: 20000,
          requestId: response.requestId
        });
        console.log('[NOTIF-DEBUG] ComplexMode: Notificare loading creată cu id:', notificationId);
        
        // Save requestId separately for persistence across redirects
        localStorage.setItem('activeGenerationRequestId', response.requestId);
        console.log('[NOTIF-DEBUG] ComplexMode: requestId salvat în localStorage:', response.requestId);
        
        // Generation started, go to loading page
        navigate('/result', { 
          state: { requestId: response.requestId, songId: null }
        });
      } else {
        if (response.sessionId) {
          // Need payment, redirect to Stripe
          const { getStripe } = await import('../services/stripe');
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
      console.error('Generation error:', err);
      setError(err.message || 'Eroare la generare. Încearcă din nou.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleGenerateOrGoToPay = async () => {
    setHasAttemptedSubmit(true);

    const basicValidation = !selectedStyle || !songName.trim();
    const dedicationValidation = wantsDedication && (!fromName.trim() || !toName.trim() || !dedication.trim());
    const donationValidation = wantsDonation && (
      !donorName.trim() || 
      !donationAmount.trim() || 
      (donationAmount.trim() && parseInt(donationAmount) <= 0)
    );

    const hasValidationErrors = basicValidation || dedicationValidation || donationValidation;

    if (hasValidationErrors) {
      scrollToFirstError();
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
      mode: 'hard'
    };

    if (!isAuthenticated) {
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

        const { auth } = await import('../services/firebase');
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

  const calculatePrice = () => {
    let basePrice = 24.99;
    
    // If dedication is checked, add 10 RON
    if (wantsDedication) {
      basePrice += 10.00;
    }
    
    // If donation is checked, add the donation amount
    if (wantsDonation && donationAmount) {
      basePrice += parseFloat(donationAmount) || 0;
    }
    
    // Apply subscription discount of 10 RON if user has active subscription
    if (userCredits > 0 && userCredits < 999) {
      // This indicates user has subscription (credits but not unlimited)
      basePrice = Math.max(0, basePrice - 10.00);
    }
    
    return basePrice;
  };

  return (
    <div className="complex-mode-form">
      {/* Style Selection */}
              <div className="style-selection-container">
          <label className="input-label">Alege stilul:</label>
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
                <div className="style-mini-card-content">
                  <h3 className="style-mini-card-title">{style.title}</h3>
                  <p className="style-mini-card-description">{style.subtitle}</p>
                </div>
              </div>
            ))}
          </div>
          {fieldErrors.style && <div className="field-error">{fieldErrors.style}</div>}
        </div>

      {/* Song Name */}
      <div className="input-group">
        <label className="input-label">Titlu piesă:</label>
        <input
          className={`input ${fieldErrors.songName ? 'error' : ''}`}
          type="text"
          placeholder="Scrie aici numele piesei"
          value={songName}
          maxLength={100}
          onChange={(e) => {
            setSongName(e.target.value);
            resetErrors();
          }}
        />
        <div className="char-counter">{songName.length}/100</div>
        {fieldErrors.songName && <div className="field-error">{fieldErrors.songName}</div>}
      </div>

      {/* Song Details */}
      <div className="input-group">
        <label className="input-label">Detalii versuri:</label>
        <p className="checkbox-explanation">
            Spune-ne despre ce să fie versurile manelei, dă-ne detalii.
          </p>
        <input
          className="input"
          type="text"
          placeholder="Scrie aici detalii versuri"
          value={songDetails}
          maxLength={300}
          onChange={(e) => setSongDetails(e.target.value)}
        />
        <div className="char-counter">{songDetails.length}/300</div>
      </div>

      {/* Dedication Section */}
      <div className="checkbox-group">
        <div className="checkbox-content">
          <label className="checkbox-label">
            Vrei dedicație?
          </label>
          <p className="checkbox-explanation">
            Vrei să dedici această melodie unei persoane?
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

      {/* Dedication Fields */}
      {wantsDedication && (
        <>

        {/* From Name */}{/* Example Player for Dedication */}
          <div className="example-player-container">
            <div className="example-player-header">
              <span className="example-player-label">Exemplu</span>
            </div>
            <div className="example-player-content">
              <div className="example-song-info">
                <img
                  className="example-song-cover"
                  src={EXAMPLE_SONGS.dedication.apiData.imageUrl}
                  alt="cover"
                  width={48}
                  height={48}
                />
                <div className="example-song-details">
                  <span className="example-song-title">{EXAMPLE_SONGS.dedication.apiData.title}</span>
                  <span className="example-song-subtitle">Dedicație personalizată</span>
                </div>
              </div>
              <div className="example-player-controls">
                <LazyAudioPlayer
                  audioUrl={EXAMPLE_SONGS.dedication.storage.url}
                  isPlaying={activeDedicationPlayer}
                  onPlayPause={() => {
                    setActiveDedicationPlayer(!activeDedicationPlayer);
                    setActiveDonationPlayer(false); // Pause other player
                  }}
                  fallbackAudioUrl={EXAMPLE_SONGS.dedication.apiData.audioUrl}
                  onError={() => {}}
                />
              </div>
            </div>
          </div>
          <div className="input-group">
            <label className="input-label">De la cine?</label>
            <input
              className={`input ${fieldErrors.fromName ? 'error' : ''}`}
              type="text"
              placeholder="Scrie de la cine e dedicația"
              value={fromName}
              maxLength={50}
              onChange={(e) => {
                setFromName(e.target.value);
                resetErrors();
              }}
            />
            <div className="char-counter">{fromName.length}/50</div>
            {fieldErrors.fromName && <div className="field-error">{fieldErrors.fromName}</div>}
          </div>
          <div className="input-group">
            <label className="input-label">Pentru cine?</label>
            <input
              className={`input ${fieldErrors.toName ? 'error' : ''}`}
              type="text"
              placeholder="Scrie aici pentru cine e dedicația"
              value={toName}
              maxLength={50}
              onChange={(e) => {
                setToName(e.target.value);
                resetErrors();
              }}
            />
            <div className="char-counter">{toName.length}/50</div>
            {fieldErrors.toName && <div className="field-error">{fieldErrors.toName}</div>}
          </div>
          <div className="input-group">
            <label className="input-label">Dedicație</label>
            {/* <p className="checkbox-explanation">
              Spune-ne aici ce vrei sa spună în dedicație.
            </p> */}
            <input
              className={`input ${fieldErrors.dedication ? 'error' : ''}`}
              type="text"
              placeholder="Scrie aici ce vrei sa spună în dedicație"
              value={dedication}
              maxLength={100}
              onChange={(e) => {
                setDedication(e.target.value);
                resetErrors();
              }}
            />
            <div className="char-counter">{dedication.length}/100</div>
            {fieldErrors.dedication && <div className="field-error">{fieldErrors.dedication}</div>}
          </div>
          
          
        </>
      )}

      {/* Donation Section */}
      <div className="checkbox-group">
        <div className="checkbox-content">
          <label className="checkbox-label">
            Vrei să arunci cu bani?
          </label>
          <p className="checkbox-explanation">
            Alege suma pe care vrei să o arunci la lăutar. Exemplu: 10 RON (va fi "un milion" in piesa)
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

      {/* Donation Fields */}
      {wantsDonation && (
        <>
        {/* Example Player for Donation */}{/* Example Player for Donation */}
          <div className="example-player-container">
            <div className="example-player-header">
              <span className="example-player-label">Exemplu</span>
            </div>
            <div className="example-player-content">
              <div className="example-song-info">
                <img
                  className="example-song-cover"
                  src={EXAMPLE_SONGS.donation.apiData.imageUrl}
                  alt="cover"
                  width={48}
                  height={48}
                />
                <div className="example-song-details">
                  <span className="example-song-title">Aruncat cu 10 RON</span>
                  <span className="example-song-subtitle">Aruncat cu bani personalizat (10 RON va fi 100 RON in piesa)</span>
                </div>
              </div>
              <div className="example-player-controls">
                <LazyAudioPlayer
                  audioUrl={EXAMPLE_SONGS.aruncaCuBani.storage.url}
                  isPlaying={activeDonationPlayer}
                  fallbackAudioUrl={EXAMPLE_SONGS.aruncaCuBani.apiData.audioUrl}
                  onPlayPause={() => {
                    setActiveDonationPlayer(!activeDonationPlayer);
                    setActiveDedicationPlayer(false); // Pause other player
                  }}
                  onError={() => {}}
                />
              </div>
            </div>
          </div>
          <div className="input-group">
            <label className="input-label">Numele celui care aruncă cu bani</label>
            <input
              className={`input ${fieldErrors.donorName ? 'error' : ''}`}
              type="text"
              placeholder="Scrie aici numele celui care dă bani"
              value={donorName}
              maxLength={50}
              onChange={(e) => {
                setDonorName(e.target.value);
                resetErrors();
              }}
            />
            <div className="char-counter">{donorName.length}/50</div>
            {fieldErrors.donorName && <div className="field-error">{fieldErrors.donorName}</div>}
          </div>
          <div className="input-group">
            <label className="input-label">Suma (RON)</label>
            <input
              className={`input ${fieldErrors.donationAmount ? 'error' : ''}`}
              type="number"
              placeholder="Scrie aici suma"
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
          
          
        </>
      )}

      {/* Price Display */}
      <div className="price-container-wrapper">
        <div className="price-container">
          <div className="price-card">
            <h3 className="price-title">Preț final <br/><i>(două manele la preț de una)</i></h3>
            <div className="price-amount">
              <span className="price-value">{calculatePrice().toFixed(2)}</span>
              <span className="price-currency">RON</span>
            </div>
            <div className="price-breakdown">
              <div className="price-item">
                <span className="price-item-label">2 manele:</span>
                <span className="price-item-value">24.99 RON</span>
              </div>
              {wantsDedication && (
                <div className="price-item">
                  <span className="price-item-label">Dedicație:</span>
                  <span className="price-item-value">+10.00 RON</span>
                </div>
              )}
              {wantsDonation && donationAmount && (
                <div className="price-item">
                  <span className="price-item-label">Aruncat cu bani:</span>
                  <span className="price-item-value">+{parseFloat(donationAmount) || 0} RON</span>
                </div>
              )}
              {userCredits > 0 && userCredits < 999 && (
                <div className="price-item discount">
                  <span className="price-item-label">Reducere abonament:</span>
                  <span className="price-item-value">-10.00 RON</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Buttons */}
      <div className="buttons-container">
        <button 
          className="hero-btn button generate-button" 
          onClick={handleGenerateOrGoToPay}
          disabled={isProcessing}
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
  );
}
