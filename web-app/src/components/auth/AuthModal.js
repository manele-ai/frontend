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
            <ResetPasswordForm
              formData={formData}
              handleInputChange={handleInputChange}
              handleResetPassword={handleResetPassword}
              loading={loading}
              setShowResetPassword={setShowResetPassword}
            />
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
              />
            )}
          </div>
        )}
      </div>
    </div>
  );
} 