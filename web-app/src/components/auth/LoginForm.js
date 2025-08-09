import { useEffect, useRef } from 'react';
import { PhoneInput } from './PhoneInput';

export function LoginForm({ 
  formData, 
  handleInputChange, 
  handleAuthSubmit, 
  handleGoogleSignIn, 
  loading, 
  toggleMode, 
  setShowResetPassword,
  formError,
  fieldErrors,
  isPhoneAuth,
  showVerificationCode,
  toggleAuthMethod,
  resendTimer,
  lastPhoneNumber,
  handleResendCode,
  handleBackToPhone,
  title = 'Autentificare',
  subtitle = 'Bine ai revenit! Autentifică-te pentru a continua.'
}) {
  const inputRef = useRef(null);

  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, [isPhoneAuth]);

  if (showVerificationCode) {
    return (
      <form onSubmit={handleAuthSubmit} className="auth-form">
        <div className="verification-info">
          <p>Am trimis un cod de verificare la numărul:</p>
          <p className="phone-number">{lastPhoneNumber}</p>
        </div>
        <div className="input-group">
          <input
            type="text"
            name="verificationCode"
            placeholder="Cod de verificare"
            value={formData.verificationCode}
            onChange={handleInputChange}
            className="auth-input"
            required
            ref={inputRef}
            autoComplete="off"
          />
        </div>
        {formError && <div className="auth-error">{formError}</div>}
        <button type="submit" className="auth-button" disabled={loading}>
          <span className="auth-button-text">
            {loading ? 'Se procesează...' : 'Verifică codul'}
          </span>
        </button>
        <div className="verification-actions">
          {resendTimer > 0 ? (
            <p className="timer">Retrimitere cod posibilă în {resendTimer}s</p>
          ) : (
            <>
              <button
                type="button"
                onClick={handleBackToPhone}
                className="auth-link-button"
              >
                ← Schimbă numărul de telefon
              </button>
              <button
                type="button"
                onClick={handleResendCode}
                className="auth-link-button"
                disabled={loading}
              >
                Retrimite codul
              </button>
            </>
          )}
        </div>
      </form>
    );
  }

  return (
    <form onSubmit={handleAuthSubmit} className="auth-form">
      <h1 className="auth-title">{title}</h1>
      <p className="auth-subtitle">{subtitle}</p>

      <div className="auth-toggle-method">
        <button
          type="button"
          onClick={() => toggleAuthMethod('email')}
          className={`auth-toggle-button ${!isPhoneAuth ? 'active' : ''}`}
        >
          Email
        </button>
        <button
          type="button"
          onClick={() => toggleAuthMethod('phone')}
          className={`auth-toggle-button ${isPhoneAuth ? 'active' : ''}`}
        >
          Telefon
        </button>
      </div>

      {isPhoneAuth ? (
        <PhoneInput
          value={formData.phoneNumber}
          onChange={handleInputChange}
          error={fieldErrors.phoneNumber}
          autoFocus={true}
        />
      ) : (
        <>
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
        </>
      )}

      {formError && <div className="auth-error">{formError}</div>}
      <button
        type="submit"
        className="auth-button"
        disabled={loading}
      >
        <span className="auth-button-text">
          {loading ? 'Se procesează...' : 'Autentificare'}
        </span>
      </button>

      <div className="auth-links">
        {!isPhoneAuth && !showVerificationCode && (
          <button
            type="button"
            onClick={() => setShowResetPassword(true)}
            className="auth-link-button"
          >
            Ai uitat parola?
          </button>
        )}
        <button
          type="button"
          onClick={toggleMode}
          className="auth-link-button"
        >
          Nu ai cont? Înregistrează-te
        </button>
      </div>

      {!isPhoneAuth && (
        <>
          <div className="auth-divider"><span>OR</span></div>
          <button
            type="button"
            onClick={handleGoogleSignIn}
            className="google-button"
            disabled={loading}
            style={{ padding: 0, background: 'transparent', border: 'none' }}
          >
            <img
              src="/google/web_dark_rd_ctn.svg"
              alt="Continuă cu Google"
              width={189}
              height={40}
              style={{ display: 'block', opacity: loading ? 0.7 : 1 }}
            />
          </button>
        </>
      )}
    </form>
  );
} 