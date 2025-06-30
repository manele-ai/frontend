import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { generateManeaSong } from '../api';
import { useAuth } from '../components/auth/AuthContext';
import '../styles/HomePage.css';

const STYLES = [
  'Jale ( Guta/Salam Vechi)',
  'De Petrecere ( Bem 7 zile )',
  'Comerciale ( BDLP )',
  'Lautaresti',
  'Muzica Populara',
  'Manele live',
  'De Opulenta',
  'Orientale'
];

export default function HomePage() {
  const { user, isAuthenticated, signUp, signIn, signInWithGoogle, resetPassword } = useAuth();
  const [selectedStyle, setSelectedStyle] = useState(null);
  const [fromName, setFromName] = useState('');
  const [toName, setToName] = useState('');
  const [dedication, setDedication] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [songName, setSongName] = useState('');
  const [songDetails, setSongDetails] = useState('');
  const [wantsDedication, setWantsDedication] = useState(false);
  const [wantsDonation, setWantsDonation] = useState(false);
  const [donationAmount, setDonationAmount] = useState('');
  const [mode, setMode] = useState('hard'); // 'hard' sau 'easy'
  
  // Modal state
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [isLogin, setIsLogin] = useState(true);
  const [showResetPassword, setShowResetPassword] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    displayName: ''
  });
  const [formError, setFormError] = useState('');
  const [authLoading, setAuthLoading] = useState(false);
  
  const navigate = useNavigate();

  const handleStyleSelect = (style) => {
    setSelectedStyle(style);
    setError(null);
  };

  const handleGoToPay = async () => {
    // If user is not authenticated, show auth modal
    if (!isAuthenticated) {
      setShowAuthModal(true);
      return;
    }

    // If user is authenticated, proceed with generation
    await generateSong();
  };

  const generateSong = async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Call the API with all parameters, using the correct keys for the backend
      const result = await generateManeaSong({ 
        style: selectedStyle, 
        from: fromName, 
        to: toName, 
        dedication,
        title: songName,
        lyricsDetails: songDetails,
        wantsDedication,
        wantsDonation,
        donationAmount,
        mode
      });

      // Navigate direct la loading page (pentru toți utilizatorii)
      navigate('/loading', { 
        state: { 
          taskId: result.taskId,
          style: selectedStyle,
          title: songName,
          lyricsDetails: songDetails,
        } 
      });
    } catch (err) {
      console.error('Error generating song:', err);
      setError(err.message || 'Failed to generate song. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Auth modal handlers
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    setFormError('');
  };

  const validateForm = () => {
    if (!formData.email || !formData.password) {
      setFormError('Toate câmpurile sunt obligatorii.');
      return false;
    }

    if (!isLogin && formData.password !== formData.confirmPassword) {
      setFormError('Parolele nu se potrivesc.');
      return false;
    }

    if (!isLogin && formData.password.length < 6) {
      setFormError('Parola trebuie să aibă cel puțin 6 caractere.');
      return false;
    }

    if (!isLogin && !formData.displayName.trim()) {
      setFormError('Numele este obligatoriu.');
      return false;
    }

    return true;
  };

  const handleAuthSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    setAuthLoading(true);

    if (!validateForm()) {
      setAuthLoading(false);
      return;
    }

    try {
      if (isLogin) {
        await signIn(formData.email, formData.password);
      } else {
        await signUp(formData.email, formData.password, formData.displayName);
      }
      
      setShowAuthModal(false);
      setFormData({ email: '', password: '', confirmPassword: '', displayName: '' });
      
      // After successful authentication, proceed with song generation
      await generateSong();
    } catch (error) {
      setFormError(error.message);
    } finally {
      setAuthLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setAuthLoading(true);
    try {
      await signInWithGoogle();
      setShowAuthModal(false);
      
      // After successful authentication, proceed with song generation
      await generateSong();
    } catch (error) {
      setFormError(error.message);
    } finally {
      setAuthLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setFormError('');

    if (!formData.email) {
      setFormError('Introdu adresa de email pentru resetarea parolei.');
      return;
    }

    try {
      await resetPassword(formData.email);
      setFormError('Email-ul de resetare a fost trimis. Verifică inbox-ul.');
      setShowResetPassword(false);
    } catch (error) {
      setFormError(error.message);
    }
  };

  const toggleMode = () => {
    setIsLogin(!isLogin);
    setFormError('');
    setFormData({
      email: '',
      password: '',
      confirmPassword: '',
      displayName: ''
    });
  };

  const closeModal = () => {
    setShowAuthModal(false);
    setFormError('');
    setFormData({
      email: '',
      password: '',
      confirmPassword: '',
      displayName: ''
    });
  };

  return (
    <div className="home-page">
      <div className="container">
        <h1 className="title">Genereaza manea</h1>
        
        <div className="mode-selector">
          <span className={`mode-text ${mode === 'easy' ? 'active' : ''}`}>Easy</span>
          <div className="switch-container">
            <button
              className={`switch-track ${mode === 'hard' ? 'active' : ''}`}
              onClick={() => setMode(mode === 'easy' ? 'hard' : 'easy')}
            >
              <div className={`switch-thumb ${mode === 'hard' ? 'active' : ''}`} />
            </button>
          </div>
          <span className={`mode-text ${mode === 'hard' ? 'active' : ''}`}>Complex</span>
        </div>
        
        <div className="input-group">
          <label className="input-label">Nume piesă</label>
          <input
            className="input"
            type="text"
            placeholder="Nume piesă"
            value={songName}
            onChange={(e) => setSongName(e.target.value)}
            disabled={isLoading}
          />
        </div>
        
        {mode === 'hard' && (
          <div className="input-group">
            <label className="input-label">Detalii versuri</label>
            <input
              className="input"
              type="text"
              placeholder="Detalii versuri (ex: temă, atmosferă, poveste)"
              value={songDetails}
              onChange={(e) => setSongDetails(e.target.value)}
              disabled={isLoading}
            />
          </div>
        )}
        
        <div className="styles-container">
          <label className="input-label">Alege stilul</label>
          <div className="styles-list">
            {STYLES.map((style) => (
              <button
                key={style}
                className={`style-button ${selectedStyle === style ? 'selected' : ''}`}
                onClick={() => handleStyleSelect(style)}
                disabled={isLoading}
              >
                {style}
              </button>
            ))}
          </div>
        </div>
        
        {mode === 'hard' && (
          <>
            <div className="checkbox-group">
              <input
                type="checkbox"
                checked={wantsDedication}
                onChange={(e) => setWantsDedication(e.target.checked)}
                disabled={isLoading}
                id="dedication-checkbox"
              />
              <label htmlFor="dedication-checkbox" className="checkbox-label">
                Vrei dedicație?
              </label>
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
                    disabled={isLoading}
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
                    disabled={isLoading}
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
                    disabled={isLoading}
                  />
                </div>
              </>
            )}
            
            <div className="checkbox-group">
              <input
                type="checkbox"
                checked={wantsDonation}
                onChange={(e) => setWantsDonation(e.target.checked)}
                disabled={isLoading}
                id="donation-checkbox"
              />
              <label htmlFor="donation-checkbox" className="checkbox-label">
                Vrei să arunci cu bani?
              </label>
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
                  disabled={isLoading}
                />
              </div>
            )}
          </>
        )}
        
        <button
          className={`button generate-button ${!selectedStyle || isLoading ? 'disabled' : ''}`}
          onClick={handleGoToPay}
          disabled={!selectedStyle || isLoading}
        >
          {isLoading ? 'Se procesează...' : 'Plateste'}
        </button>
        
        {error && (
          <div className="error-box">
            <p className="error-text">{error}</p>
          </div>
        )}
      </div>

      {/* Authentication Modal */}
      {showAuthModal && (
        <div className="auth-modal-overlay">
          <div className="auth-modal">
            <div className="auth-modal-header">
              <h2>Autentificare necesară</h2>
              <p>Pentru a genera o manea, trebuie să te autentifici sau să îți creezi un cont</p>
            </div>

            {showResetPassword ? (
              <div className="auth-modal-content">
                <h3>Resetare Parolă</h3>
                <p>Introdu adresa de email pentru a primi link-ul de resetare</p>
                
                <form onSubmit={handleResetPassword} className="auth-form">
                  <div className="input-group">
                    <input
                      type="email"
                      name="email"
                      placeholder="Adresa de email"
                      value={formData.email}
                      onChange={handleInputChange}
                      className="auth-input"
                      required
                    />
                  </div>
                  
                  <button type="submit" className="auth-button" disabled={authLoading}>
                    {authLoading ? 'Se trimite...' : 'Trimite Email Resetare'}
                  </button>
                  
                  <button
                    type="button"
                    onClick={() => setShowResetPassword(false)}
                    className="auth-link-button"
                  >
                    ← Înapoi la autentificare
                  </button>
                </form>
                
                {formError && <div className="auth-error">{formError}</div>}
              </div>
            ) : (
              <div className="auth-modal-content">
                <h3>{isLogin ? 'Autentificare' : 'Înregistrare'}</h3>
                <p>
                  {isLogin 
                    ? 'Bine ai revenit! Autentifică-te pentru a genera maneaua.' 
                    : 'Creează-ți contul pentru a începe să generezi manele.'
                  }
                </p>

                <form onSubmit={handleAuthSubmit} className="auth-form">
                  {!isLogin && (
                    <div className="input-group">
                      <input
                        type="text"
                        name="displayName"
                        placeholder="Nume complet"
                        value={formData.displayName}
                        onChange={handleInputChange}
                        className="auth-input"
                        required={!isLogin}
                      />
                    </div>
                  )}
                  <div className="input-group">
                    <input
                      type="email"
                      name="email"
                      placeholder="Adresa de email"
                      value={formData.email}
                      onChange={handleInputChange}
                      className="auth-input"
                      required
                    />
                  </div>
                  <div className="input-group">
                    <input
                      type="password"
                      name="password"
                      placeholder="Parola"
                      value={formData.password}
                      onChange={handleInputChange}
                      className="auth-input"
                      required
                    />
                  </div>
                  {!isLogin && (
                    <div className="input-group">
                      <input
                        type="password"
                        name="confirmPassword"
                        placeholder="Confirmă parola"
                        value={formData.confirmPassword}
                        onChange={handleInputChange}
                        className="auth-input"
                        required={!isLogin}
                      />
                    </div>
                  )}
                  <button type="submit" className="auth-button" disabled={authLoading}>
                    {authLoading 
                      ? 'Se procesează...' 
                      : (isLogin ? 'Autentificare' : 'Înregistrare')
                    }
                  </button>
                  <div className="auth-divider">
                    <span>sau</span>
                  </div>
                  <button
                    type="button"
                    onClick={handleGoogleSignIn}
                    className="google-button"
                    disabled={authLoading}
                  >
                    <svg className="google-icon" viewBox="0 0 24 24">
                      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                    </svg>
                    Continuă cu Google
                  </button>
                  <div className="auth-links">
                    {isLogin ? (
                      <>
                        <button
                          type="button"
                          onClick={() => setShowResetPassword(true)}
                          className="auth-link-button"
                        >
                          Ai uitat parola?
                        </button>
                        <button
                          type="button"
                          onClick={toggleMode}
                          className="auth-link-button"
                        >
                          Nu ai cont? Înregistrează-te
                        </button>
                      </>
                    ) : (
                      <button
                        type="button"
                        onClick={toggleMode}
                        className="auth-link-button"
                      >
                        Ai deja cont? Autentifică-te
                      </button>
                    )}
                  </div>
                </form>
                {formError && (
                  <div className="auth-error">{formError}</div>
                )}
              </div>
            )}
            
            <div className="auth-modal-footer">
              <button
                type="button"
                onClick={closeModal}
                className="auth-cancel-button"
                disabled={authLoading}
              >
                Anulează
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 