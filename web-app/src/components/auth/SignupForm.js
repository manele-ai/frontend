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