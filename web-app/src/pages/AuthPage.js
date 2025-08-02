import { useLocation, useNavigate } from 'react-router-dom';
import { LoginForm } from '../components/auth/LoginForm';
import { ResetPasswordForm } from '../components/auth/ResetPasswordForm';
import { SignupForm } from '../components/auth/SignupForm';
import { useAuthForm } from '../components/auth/useAuthForm';
import '../styles/AuthPage.css';

export default function AuthPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const infoMessage = location.state?.message;

  const {
    isLogin,
    showResetPassword,
    formData,
    formError,
    loading,
    error,
    setShowResetPassword,
    handleInputChange,
    handleAuthSubmit,
    handleGoogleSignIn,
    handleResetPassword,
    toggleMode,
    fieldErrors
  } = useAuthForm({
    onSuccess: () => navigate('/')
  });

  if (showResetPassword) {
    return (
      <div className="auth-page">
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
          />
        )}
      </div>
    </div>
  );
} 