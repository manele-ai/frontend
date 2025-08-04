import { useEffect, useRef } from 'react';

export function ResetPasswordForm({ 
  formData, 
  handleInputChange, 
  handleResetPassword, 
  loading, 
  setShowResetPassword 
}) {
  const inputRef = useRef(null);

  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);

  return (
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
        <span className="auth-button-text">
          {loading ? 'Se trimite...' : 'Trimite Email Resetare'}
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
  );
} 