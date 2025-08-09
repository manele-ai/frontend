import { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../components/auth/AuthContext';
import { LoginForm } from '../components/auth/LoginForm';
import { ResetPasswordForm } from '../components/auth/ResetPasswordForm';
import { SignupForm } from '../components/auth/SignupForm';
import { useAuthForm } from '../components/auth/useAuthForm';
import '../styles/AuthPage.css';

export default function AuthPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const infoMessage = location.state?.message;
  const { isAuthenticated, loading: authLoading } = useAuth();

  // If already authenticated (e.g., after Google redirect), send the user away from /auth
  useEffect(() => {
    if (!authLoading && isAuthenticated) {
      const redirectTo = location.state?.from?.pathname || '/';
      navigate(redirectTo, { replace: true });
    }
  }, [authLoading, isAuthenticated, navigate, location.state]);

  const {
    isLogin,
    isPhoneAuth,
    showResetPassword,
    showVerificationCode,
    formData,
    formError,
    loading,
    error,
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
    toggleAuthMethod
  } = useAuthForm({
    onSuccess: () => navigate('/')
  });

  if (showResetPassword) {
    return (
      <div 
        className="auth-page"
        style={{
          backgroundImage: 'url(/backgrounds/patternFudalSecond.svg)',
          backgroundSize: '30%',
          backgroundPosition: '0 0',
          backgroundRepeat: 'repeat',
        }}
      >
        <div className="auth-container">
          <h1 className="auth-title">Resetare Parolă</h1>
          <p className="auth-subtitle">
            Introdu adresa de email pentru a primi link-ul de resetare
          </p>
          
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
    );
  }

  return (
    <div 
      className="auth-page"
      style={{
        backgroundImage: 'url(/backgrounds/patternFudalSecond.svg)',
        backgroundSize: '30%',
        backgroundPosition: '0 0',
        backgroundRepeat: 'repeat',
      }}
    >
      <div className="auth-container">
        {infoMessage && (
          <div className="auth-error" style={{ background: '#eab111', color: '#23242b', marginBottom: 16, fontWeight: 600 }}>
            {infoMessage}
          </div>
        )}
        
        {isLogin ? (
          <LoginForm
            formData={formData}
            handleInputChange={handleInputChange}
            handleAuthSubmit={handleAuthSubmit}
            handleGoogleSignIn={handleGoogleSignIn}
            loading={loading}
            toggleMode={toggleMode}
            setShowResetPassword={setShowResetPassword}
            formError={formError || error}
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
            formError={formError || error}
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
    </div>
  );
} 