import './AuthModal.css';
import { LoginForm } from './LoginForm';
import { ResetPasswordForm } from './ResetPasswordForm';
import { SignupForm } from './SignupForm';
import { useAuthForm } from './useAuthForm';

export default function AuthModal({ isOpen, onClose, onSuccess }) {
  const {
    isLogin,
    isPhoneAuth,
    showResetPassword,
    showVerificationCode,
    formData,
    formError,
    loading,
    resendTimer,
    lastPhoneNumber,
    fieldErrors,
    setShowResetPassword,
    handleInputChange,
    handleAuthSubmit,
    handleGoogleSignIn,
    handleResetPassword,
    handleResendCode,
    handleBackToPhone,
    toggleMode,
    toggleAuthMethod,
    resetForm
  } = useAuthForm({
    onSuccess,
    onClose
  });

  const closeModal = () => {
    onClose();
    resetForm();
  };

  if (!isOpen) return null;

  if (showResetPassword) {
    return (
      <div className="auth-modal-overlay">
        <div className="auth-modal">
          <div className="auth-modal-header">
            <h2>Resetare Parolă</h2>
            <p>Introdu adresa de email pentru a primi link-ul de resetare</p>
          </div>
          <div className="auth-modal-content">
            <ResetPasswordForm
              formData={formData}
              handleInputChange={handleInputChange}
              handleResetPassword={handleResetPassword}
              loading={loading}
              setShowResetPassword={setShowResetPassword}
            />
            {formError && <div className="auth-error">{formError}</div>}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-modal-overlay">
      <div className="auth-modal">
        <div className="auth-modal-content">
          {isLogin ? (
            <LoginForm
              formData={formData}
              handleInputChange={handleInputChange}
              handleAuthSubmit={handleAuthSubmit}
              handleGoogleSignIn={handleGoogleSignIn}
              loading={loading}
              toggleMode={toggleMode}
              setShowResetPassword={setShowResetPassword}
              formError={formError}
              fieldErrors={fieldErrors}
              isPhoneAuth={isPhoneAuth}
              showVerificationCode={showVerificationCode}
              toggleAuthMethod={toggleAuthMethod}
              resendTimer={resendTimer}
              lastPhoneNumber={lastPhoneNumber}
              handleResendCode={handleResendCode}
              handleBackToPhone={handleBackToPhone}
              title="Autentificare"
              subtitle="Trebuie să te autentifici pentru a genera manele."
            />
          ) : (
            <SignupForm
              formData={formData}
              handleInputChange={handleInputChange}
              handleAuthSubmit={handleAuthSubmit}
              handleGoogleSignIn={handleGoogleSignIn}
              loading={loading}
              toggleMode={toggleMode}
              formError={formError}
              fieldErrors={fieldErrors}
              isPhoneAuth={isPhoneAuth}
              showVerificationCode={showVerificationCode}
              toggleAuthMethod={toggleAuthMethod}
              resendTimer={resendTimer}
              lastPhoneNumber={lastPhoneNumber}
              handleResendCode={handleResendCode}
              handleBackToPhone={handleBackToPhone}
              title="Înregistrare"
              subtitle="Trebuie să te autentifici pentru a genera manele."
            />
          )}
        </div>
      </div>
    </div>
  );
} 