import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { AUTH_PHASE, useAuth } from './AuthContext';
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
  const { isAuthenticated, loading: isLoadingAuth, authPhase } = useAuth();

  const closeModal = () => {
    onClose();
    resetForm();
  };

  const handleOverlayClick = (e) => {
    // Close modal when clicking on the overlay background
    // But prevent closing if auth flow is started but not finished
    if (e.target === e.currentTarget && !(authPhase === AUTH_PHASE.STARTED)) {
      closeModal();
    }
  };

  // Wrapper for auth submit that sets flow started
  const handleAuthSubmitWrapper = (e) => {
    return handleAuthSubmit(e);
  };

  // Wrapper for Google sign in that sets flow started
  const handleGoogleSignInWrapper = () => {
    return handleGoogleSignIn();
  };

  // Prevent body scroll when modal is open and handle keyboard events
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      document.body.style.paddingRight = '0px'; // Prevent layout shift
      
      // Handle escape key
      const handleEscape = (e) => {
        if (e.key === 'Escape' && !(authPhase === AUTH_PHASE.STARTED)) {
          closeModal();
        }
      };
      
      document.addEventListener('keydown', handleEscape);
      
      return () => {
        document.body.style.overflow = '';
        document.body.style.paddingRight = '';
        document.removeEventListener('keydown', handleEscape);
      };
    } else {
      document.body.style.overflow = '';
      document.body.style.paddingRight = '';
    }
  }, [isOpen, authPhase]);
  

  // Don't show modal if not open yet or user already authenticated
  if (!isOpen || authPhase === AUTH_PHASE.READY) return null;

  const modalContent = showResetPassword ? (
    <div className="auth-modal-overlay" onClick={handleOverlayClick}>
      <div className={`auth-modal ${authPhase === AUTH_PHASE.STARTED ? 'auth-flow-active' : ''}`}>
        {!(authPhase === AUTH_PHASE.STARTED) && (
          <button className="auth-modal-close" onClick={closeModal}>×</button>
        )}
        <div className="auth-modal-content">
          <h1 className="auth-title">Resetare Parolă</h1>
          <p className="auth-subtitle">Introdu adresa de email pentru a primi link-ul de resetare</p>
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
  ) : (
    <div className="auth-modal-overlay" onClick={handleOverlayClick}>
      <div className={`auth-modal ${authPhase === AUTH_PHASE.STARTED ? 'auth-flow-active' : ''}`}>
        {!(authPhase === AUTH_PHASE.STARTED) && (
          <button className="auth-modal-close" onClick={closeModal}>×</button>
        )}
        <div className="auth-modal-content">
          {isLogin ? (
            <LoginForm
              formData={formData}
              handleInputChange={handleInputChange}
              handleAuthSubmit={handleAuthSubmitWrapper}
              handleGoogleSignIn={handleGoogleSignInWrapper}
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
              handleAuthSubmit={handleAuthSubmitWrapper}
              handleGoogleSignIn={handleGoogleSignInWrapper}
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

  // Render the modal at the root level using a portal
  return createPortal(modalContent, document.body);
} 