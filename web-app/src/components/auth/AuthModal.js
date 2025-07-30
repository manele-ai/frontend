import { useState } from 'react';
import { useAuth } from './AuthContext';
import './AuthModal.css';

export default function AuthModal({ isOpen, onClose, onSuccess }) {
  const { signUp, signIn, signInWithGoogle, resetPassword } = useAuth();
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

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
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
      onClose();
      setFormData({ email: '', password: '', confirmPassword: '', displayName: '' });
      onSuccess();
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
      onClose();
      onSuccess();
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
    setFormData({ email: '', password: '', confirmPassword: '', displayName: '' });
  };

  const closeModal = () => {
    onClose();
    setFormError('');
    setFormData({ email: '', password: '', confirmPassword: '', displayName: '' });
  };

  if (!isOpen) return null;

  return (
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
              <button type="submit" className="auth-modal-button" disabled={authLoading}>
                <span className="hero-btn-text">
                  {authLoading ? 'Se trimite...' : 'Trimite Email Resetare'}
                </span>
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
              <button type="submit" className="auth-modal-button" disabled={authLoading}>
                <span className="hero-btn-text">
                  {authLoading ? 'Se procesează...' : (isLogin ? 'Autentificare' : 'Înregistrare')}
                </span>
              </button>
              <button
                type="button"
                onClick={handleGoogleSignIn}
                className="google-auth-button"
                disabled={authLoading}
              >
                <img src="/icons/google.svg" alt="Google" className="google-icon" />
                {authLoading ? 'Se procesează...' : 'Continuă cu Google'}
              </button>
              <button
                type="button"
                onClick={toggleMode}
                className="auth-link-button"
              >
                {isLogin ? 'Nu ai cont? Înregistrează-te' : 'Ai deja cont? Autentifică-te'}
              </button>
              {isLogin && (
                <button
                  type="button"
                  onClick={() => setShowResetPassword(true)}
                  className="auth-link-button"
                >
                  Ai uitat parola?
                </button>
              )}
            </form>
            {formError && (
              <div className="auth-error">{formError}</div>
            )}
          </div>
        )}
      </div>
    </div>
  );
} 