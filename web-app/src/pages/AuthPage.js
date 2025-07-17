import { useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../components/auth/AuthContext';
import '../styles/AuthPage.css';

export default function AuthPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { signUp, signIn, signInWithGoogle, resetPassword, loading, error } = useAuth();
  
  const [isLogin, setIsLogin] = useState(true);
  const [showResetPassword, setShowResetPassword] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    displayName: ''
  });
  const [formError, setFormError] = useState('');
  const inputRef = useRef(null);

  // Focus pe primul input la mount
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, [isLogin, showResetPassword]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    setFormError(''); // Clear error when user types
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');

    if (!validateForm()) return;

    try {
      if (isLogin) {
        await signIn(formData.email, formData.password);
      } else {
        await signUp(formData.email, formData.password, formData.displayName);
      }
      navigate('/'); // Redirect to home after successful auth
    } catch (error) {
      setFormError(error.message);
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      await signInWithGoogle();
      navigate('/');
    } catch (error) {
      setFormError(error.message);
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

  // Mesaj din location.state (ex: "trebuie să te loghezi")
  const infoMessage = location.state?.message;

  if (showResetPassword) {
    return (
      <div className="auth-page">
        <div className="auth-container">
          <h1 className="auth-title">Resetare Parolă</h1>
          <p className="auth-subtitle">
            Introdu adresa de email pentru a primi link-ul de resetare
          </p>
          
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
                ref={inputRef}
              />
            </div>
            
            <button type="submit" className="auth-button" disabled={loading}>
              <span className="auth-button-text">{loading ? 'Se trimite...' : 'Trimite Email Resetare'}</span>
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
      </div>
    );
  }

  return (
    <div className="auth-page">
      <div className="auth-container">
        <h1 className="auth-title">
          {isLogin ? 'Autentificare' : 'Înregistrare'}
        </h1>
        <p className="auth-subtitle">
          {isLogin 
            ? 'Bine ai revenit! Autentifică-te pentru a continua.' 
            : 'Creează-ți contul pentru a începe să generezi manele.'
          }
        </p>
        {infoMessage && (
          <div className="auth-error" style={{ background: '#eab111', color: '#23242b', marginBottom: 16, fontWeight: 600 }}>
            {infoMessage}
          </div>
        )}
        <form onSubmit={handleSubmit} className="auth-form">
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
                ref={inputRef}
              />
            </div>
          )}
          {isLogin && (
            <div className="input-group">
              <input
                type="email"
                name="email"
                placeholder="Adresa de email"
                value={formData.email}
                onChange={handleInputChange}
                className="auth-input"
                required
                ref={inputRef}
              />
            </div>
          )}
          {!isLogin && (
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
          )}
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
          <button type="submit" className="auth-button" disabled={loading}>
            <span className="auth-button-text">{loading 
              ? 'Se procesează...' 
              : (isLogin ? 'Autentificare' : 'Înregistrare')
            }</span>
          </button>
          <div className="auth-divider">
            
          </div>
          <button
            type="button"
            onClick={handleGoogleSignIn}
            className="google-button"
            disabled={loading}
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
        {(formError || error) && (
          <div className="auth-error">{formError || error}</div>
        )}
      </div>
    </div>
  );
} 