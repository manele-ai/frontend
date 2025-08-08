import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useNotification } from '../context/NotificationContext';
import { styles } from '../data/stylesData';
import { createGenerationRequest } from '../services/firebase/functions';
import '../styles/GeneratePage.css';
import { useAuth } from './auth/AuthContext';
import AuthModal from './auth/AuthModal';

// Constante pentru localStorage - Easy Mode
const EASY_FORM_DATA_KEYS = {
  SELECTED_STYLE: 'easyForm_selectedStyle',
  SONG_NAME: 'easyForm_songName',
  IS_ACTIVE: 'easyForm_isActive'
};

export default function EasyModeForm({ onBack, preSelectedStyle }) {
  const { user, isAuthenticated, waitForUserDocCreation } = useAuth();
  const { showNotification } = useNotification();
  const navigate = useNavigate();

  // State pentru Easy Mode
  const [selectedStyle, setSelectedStyle] = useState(preSelectedStyle || null);
  const [songName, setSongName] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState(null);
  const [fieldErrors, setFieldErrors] = useState({
    style: '',
    songName: ''
  });
  const [hasAttemptedSubmit, setHasAttemptedSubmit] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [userCredits, setUserCredits] = useState(0);
  const [pendingGenerationParams, setPendingGenerationParams] = useState(null);

  // Funcții pentru persistența formularului
  const saveFormData = useCallback(() => {
    const formData = {
      selectedStyle,
      songName
    };
    
    Object.entries(formData).forEach(([key, value]) => {
      const keyMapping = {
        'selectedStyle': 'SELECTED_STYLE',
        'songName': 'SONG_NAME'
      };
      
      const mappedKey = keyMapping[key];
      const storageKey = mappedKey ? EASY_FORM_DATA_KEYS[mappedKey] : undefined;
      
      if (storageKey) {
        if (typeof value === 'string') {
          localStorage.setItem(storageKey, value);
        } else {
          localStorage.setItem(storageKey, JSON.stringify(value));
        }
      }
    });
    localStorage.setItem(EASY_FORM_DATA_KEYS.IS_ACTIVE, 'true');
  }, [selectedStyle, songName]);

  const loadFormData = useCallback(() => {
    const isActive = localStorage.getItem(EASY_FORM_DATA_KEYS.IS_ACTIVE) === 'true';
    
    if (!isActive) return false;
    
    try {
      const safeParse = (key, defaultValue) => {
        try {
          const value = localStorage.getItem(key);
          if (value === null || value === undefined) return defaultValue;
          
          if (key === EASY_FORM_DATA_KEYS.SELECTED_STYLE) {
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
      
      const loadedStyle = safeParse(EASY_FORM_DATA_KEYS.SELECTED_STYLE, null);
      const loadedSongName = safeGetString(EASY_FORM_DATA_KEYS.SONG_NAME, '');
      
      // Verifică dacă există date reale pentru a încărca
      const hasRealData = loadedStyle || (loadedSongName && loadedSongName.trim());
      
      if (!hasRealData) {
        // Dacă nu există date reale, șterge IS_ACTIVE și nu încărca nimic
        localStorage.removeItem(EASY_FORM_DATA_KEYS.IS_ACTIVE);
        return false;
      }
      
      setSelectedStyle(loadedStyle);
      setSongName(loadedSongName);
      
      return true;
    } catch (error) {
      console.error('Eroare la încărcarea datelor formularului:', error);
      return false;
    }
  }, []);

  const clearFormData = useCallback(() => {
    Object.values(EASY_FORM_DATA_KEYS).forEach(key => {
      localStorage.removeItem(key);
    });
  }, []);

  // Load user credits
  useEffect(() => {
    if (user && isAuthenticated) {
      import('firebase/firestore').then(({ getDoc, doc }) => {
        import('../services/firebase').then(({ db }) => {
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
    const hasRealData = (songName && songName.trim());
    
    if (hasRealData && !dataLoadedFromStorage) {
      saveFormData();
    }
  }, [songName, saveFormData, dataLoadedFromStorage]);

  // Update field errors
  useEffect(() => {
    if (!hasAttemptedSubmit) {
      return;
    }

    const newErrors = {
      style: !selectedStyle ? 'Te rugăm să selectezi un stil.' : '',
      songName: !songName.trim() ? 'Te rugăm să introduci numele piesei.' : ''
    };

    setFieldErrors(newErrors);
  }, [hasAttemptedSubmit, selectedStyle, songName]);

  const resetErrors = () => {
    if (hasAttemptedSubmit) {
      setHasAttemptedSubmit(false);
      setFieldErrors({
        style: '',
        songName: ''
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
        from: '',
        to: '',
        dedication: '',
        lyricsDetails: '',
        wantsDedication: false,
        wantsDonation: false,
        donationAmount: '',
        donorName: '',
        mode: 'easy'
      };

      const response = await createGenerationRequest(params);
      
      if (response.paymentStatus === 'success') {
        console.log('[NOTIF-DEBUG] EasyMode: Creare notificare loading cu requestId:', response.requestId);
        
        // Șterge datele formularului când generarea începe cu succes
        clearFormData();
        
        // Show loading notification with requestId
        const notificationId = showNotification({
          type: 'loading',
          title: 'Se generează maneaua...',
          message: 'AI-ul compune melodia ta personalizată.',
          duration: 'manual',
          requestId: response.requestId
        });
        console.log('[NOTIF-DEBUG] EasyMode: Notificare loading creată cu id:', notificationId);
        
        // Save requestId separately for persistence across redirects
        localStorage.setItem('activeGenerationRequestId', response.requestId);
        console.log('[NOTIF-DEBUG] EasyMode: requestId salvat în localStorage:', response.requestId);
        
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

    if (basicValidation) {
      return;
    }

    const params = {
      style: selectedStyle,
      title: songName,
      from: '',
      to: '',
      dedication: '',
      lyricsDetails: '',
      wantsDedication: false,
      wantsDonation: false,
      donationAmount: '',
      donorName: '',
      mode: 'easy'
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
    return 29.99; // Preț fix pentru Easy Mode
  };

  return (
    <div className="easy-mode-form">
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

      {/* Price Display */}
      <div className="price-container-wrapper">
        <div className="price-container">
          <div className="price-card">
            <h3 className="price-title">Preț final</h3>
            <div className="price-amount">
              <span className="price-value">{calculatePrice().toFixed(2)}</span>
              <span className="price-currency">RON</span>
            </div>
            <div className="price-breakdown">
              <div className="price-item">
                <span className="price-item-label">Preț de bază:</span>
                <span className="price-item-value">29.99 RON</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Buttons */}
      <div className="buttons-container">
        <button 
          className="hero-btn button generate-button" 
          onClick={handleGenerateOrGoToPay}
          disabled={isProcessing || !selectedStyle || !songName.trim()}
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
