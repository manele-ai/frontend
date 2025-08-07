import { useEffect, useRef } from 'react';
import { PhoneInput } from './PhoneInput';

export function SignupForm({
  formData,
  handleInputChange,
  handleAuthSubmit,
  handleGoogleSignIn,
  loading,
  toggleMode,
  formError,
  fieldErrors,
  isPhoneAuth,
  showVerificationCode,
  toggleAuthMethod,
  resendTimer,
  lastPhoneNumber,
  handleResendCode,
  handleBackToPhone,
  title = 'Înregistrare',
  subtitle = 'Creează-ți contul pentru a începe să generezi manele.'
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

      <div className="input-group">
        <input
          type="text"
          name="displayName"
          placeholder="Nume complet"
          value={formData.displayName}
          onChange={handleInputChange}
          className="auth-input"
          required
          ref={!isPhoneAuth ? inputRef : null}
        />
      </div>

      {isPhoneAuth ? (
        <PhoneInput
          value={formData.phoneNumber}
          onChange={handleInputChange}
          error={fieldErrors.phoneNumber}
          autoFocus={false}
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
              className={`auth-input ${fieldErrors.email ? 'auth-input-error' : ''}`}
              required
            />
            {fieldErrors.email && (
              <div className="field-error">{fieldErrors.email}</div>
            )}
          </div>
          <div className="auth-form-row">
            <div className="input-group">
              <input
                type="password"
                name="password"
                placeholder="Parola"
                value={formData.password}
                onChange={handleInputChange}
                className={`auth-input ${fieldErrors.password ? 'auth-input-error' : ''}`}
                required
              />
              {fieldErrors.password && (
                <div className="field-error">{fieldErrors.password}</div>
              )}
            </div>
            <div className="input-group">
              <input
                type="password"
                name="confirmPassword"
                placeholder="Confirmă parola"
                value={formData.confirmPassword}
                onChange={handleInputChange}
                className={`auth-input ${fieldErrors.confirmPassword ? 'auth-input-error' : ''}`}
                required
              />
              {fieldErrors.confirmPassword && (
                <div className="field-error">{fieldErrors.confirmPassword}</div>
              )}
            </div>
          </div>
        </>
      )}

      {formError && <div className="auth-error">{formError}</div>}
      <button type="submit" className="auth-button" disabled={loading}>
        <span className="auth-button-text">
          {loading ? 'Se procesează...' : 'Înregistrare'}
        </span>
      </button>

      <button
        type="button"
        onClick={toggleMode}
        className="auth-link-button"
      >
        Ai deja cont? Autentifică-te
      </button>

      {!isPhoneAuth && (
        <>
          <div className="auth-divider">
            <span>OR</span>
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
        </>
      )}
    </form>
  );
} 