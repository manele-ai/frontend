import { useEffect, useState } from 'react';
import { useAuth } from './AuthContext';

/**
 * @typedef {Object} AuthFormProps
 * @property {() => void} [onSuccess]
 * @property {() => void} [onClose]
 */

/**
 * @param {AuthFormProps} [props]
 */
export function useAuthForm({ onSuccess, onClose } = {}) {
  const { signUp, signIn, signInWithGoogle, signInWithPhone, verifyPhoneCode, resetPassword } = useAuth();
  const [isLogin, setIsLogin] = useState(true);
  const [showResetPassword, setShowResetPassword] = useState(false);
  const [isPhoneAuth, setIsPhoneAuth] = useState(false);
  const [confirmationResult, setConfirmationResult] = useState(null);
  const [showVerificationCode, setShowVerificationCode] = useState(false);
  const [resendTimer, setResendTimer] = useState(0);
  const [lastPhoneNumber, setLastPhoneNumber] = useState('');
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    displayName: '',
    phoneNumber: '',
    verificationCode: ''
  });
  const [formError, setFormError] = useState('');
  const [loading, setLoading] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    phoneNumber: ''
  });

  // Timer for resend code
  useEffect(() => {
    let interval;
    if (resendTimer > 0) {
      interval = setInterval(() => {
        setResendTimer(current => current - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [resendTimer]);

  // Phone number validation with debounce
  useEffect(() => {
    if (!formData.phoneNumber || !isPhoneAuth) {
      setFieldErrors(prev => ({
        ...prev,
        phoneNumber: ''
      }));
      return;
    }
    
    const timer = setTimeout(() => {
      // Allow + and numbers, require at least 10 digits
      const phoneRegex = /^\+?[0-9]{10,}$/;
      if (!phoneRegex.test(formData.phoneNumber.replace(/\s+/g, ''))) {
        setFieldErrors(prev => ({
          ...prev,
          phoneNumber: 'Numărul de telefon trebuie să conțină minim 10 cifre și poate începe cu +'
        }));
      } else {
        setFieldErrors(prev => ({
          ...prev,
          phoneNumber: ''
        }));
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [formData.phoneNumber, isPhoneAuth]);

  // Email validation with debounce
  useEffect(() => {
    if (!formData.email || isLogin || isPhoneAuth) return;
    
    const timer = setTimeout(() => {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.email)) {
        setFieldErrors(prev => ({
          ...prev,
          email: 'Adresa de email nu este validă'
        }));
      } else {
        setFieldErrors(prev => ({
          ...prev,
          email: ''
        }));
      }
    }, 1000);

    return () => clearTimeout(timer);
  }, [formData.email, isLogin, isPhoneAuth]);

  // Password validation with debounce
  useEffect(() => {
    if (!formData.password || isLogin || isPhoneAuth) return;
    
    const timer = setTimeout(() => {
      if (formData.password.length < 8) {
        setFieldErrors(prev => ({
          ...prev,
          password: 'Parola trebuie să aibă cel puțin 8 caractere'
        }));
      } else {
        setFieldErrors(prev => ({
          ...prev,
          password: ''
        }));
      }
    }, 1000);

    return () => clearTimeout(timer);
  }, [formData.password, isLogin, isPhoneAuth]);

  // Confirm password validation with debounce
  useEffect(() => {
    if (!formData.confirmPassword || isLogin || isPhoneAuth) return;
    
    const timer = setTimeout(() => {
      if (formData.confirmPassword !== formData.password) {
        setFieldErrors(prev => ({
          ...prev,
          confirmPassword: 'Parolele nu se potrivesc'
        }));
      } else {
        setFieldErrors(prev => ({
          ...prev,
          confirmPassword: ''
        }));
      }
    }, 1000);

    return () => clearTimeout(timer);
  }, [formData.confirmPassword, formData.password, isLogin, isPhoneAuth]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    setFormError('');
    // Clear field error when user starts typing
    if (fieldErrors[name]) {
      setFieldErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const handleResendCode = async () => {
    if (resendTimer > 0) return;
    
    setLoading(true);
    setFormError('');
    try {
      let phoneNumber = lastPhoneNumber.replace(/\s+/g, '');
      if (!phoneNumber.startsWith('+')) {
        phoneNumber = '+' + phoneNumber;
      }
      const result = await signInWithPhone(phoneNumber);
      setConfirmationResult(result);
      setResendTimer(60);
      setFormData(prev => ({
        ...prev,
        verificationCode: ''
      }));
    } catch (error) {
      console.error('Resend code error:', error);
      setFormError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleBackToPhone = () => {
    if (resendTimer > 0) return;
    setShowVerificationCode(false);
    setConfirmationResult(null);
    setFormData(prev => ({
      ...prev,
      verificationCode: ''
    }));
    setFormError('');
  };

  const validateForm = () => {
    if (isPhoneAuth) {
      if (showVerificationCode) {
        if (!formData.verificationCode) {
          setFormError('Te rugăm să introduci codul de verificare.');
          return false;
        }
        return true;
      }

      if (!formData.phoneNumber) {
        setFormError('Te rugăm să introduci numărul de telefon.');
        return false;
      }

      // Format phone number before validation
      const cleanPhoneNumber = formData.phoneNumber.replace(/\s+/g, '');
      if (!/^\+?[0-9]{10,}$/.test(cleanPhoneNumber)) {
        setFormError('Numărul de telefon trebuie să conțină minim 10 cifre și poate începe cu +');
        return false;
      }

      if (!isLogin && !formData.displayName.trim()) {
        setFormError('Numele este obligatoriu.');
        return false;
      }

      return true;
    }

    if (!formData.email || !formData.password) {
      setFormError('Toate câmpurile sunt obligatorii.');
      return false;
    }

    if (!isLogin) {
      if (fieldErrors.email || fieldErrors.password || fieldErrors.confirmPassword) {
        setFormError('Te rugăm să corectezi erorile din formular.');
        return false;
      }
      
      if (formData.password.length < 8) {
        setFormError('Parola trebuie să aibă cel puțin 8 caractere.');
        return false;
      }
      
      if (formData.password !== formData.confirmPassword) {
        setFormError('Parolele nu se potrivesc.');
        return false;
      }

      if (!formData.displayName.trim()) {
        setFormError('Numele este obligatoriu.');
        return false;
      }
    }
    return true;
  };

  const handleAuthSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    setLoading(true);
    
    if (!validateForm()) {
      setLoading(false);
      return;
    }

    try {
      if (isPhoneAuth) {
        if (showVerificationCode) {
          const trimmedDisplayName = !isLogin ? formData.displayName.trim() : undefined;
          if (!isLogin && !trimmedDisplayName) {
            throw new Error('Numele este obligatoriu.');
          }
          await verifyPhoneCode(
            confirmationResult, 
            formData.verificationCode,
            trimmedDisplayName
          );
          if (onClose) onClose();
          resetForm();
          if (onSuccess) onSuccess();
        } else {
          // Format phone number before sending
          let phoneNumber = formData.phoneNumber.replace(/\s+/g, '');
          if (!phoneNumber.startsWith('+')) {
            phoneNumber = '+' + phoneNumber;
          }
          try {
            const result = await signInWithPhone(phoneNumber);
            setConfirmationResult(result);
            setShowVerificationCode(true);
            setLastPhoneNumber(phoneNumber);
            setResendTimer(60);
            setLoading(false);
            return;
          } catch (error) {
            if (error.code === 'auth/user-not-found' && isLogin) {
              setFieldErrors(prev => ({
                ...prev,
                phoneNumber: 'Nu există niciun cont cu acest număr de telefon.'
              }));
              throw new Error('Nu există niciun cont cu acest număr de telefon.');
            }
            throw error;
          }
        }
      } else {
        if (isLogin) {
          await signIn(formData.email, formData.password);
        } else {
          const trimmedDisplayName = formData.displayName.trim();
          if (!trimmedDisplayName) {
            throw new Error('Numele este obligatoriu.');
          }
          await signUp(formData.email, formData.password, trimmedDisplayName);
        }
        
        if (onClose) onClose();
        resetForm();
        if (onSuccess) onSuccess();
      }
    } catch (error) {
      console.error('Auth error:', error);
      setFormError(error.message);
      if (isPhoneAuth && showVerificationCode) {
        setShowVerificationCode(false);
        setConfirmationResult(null);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setLoading(true);
    try {
      await signInWithGoogle();
      if (onClose) onClose();
      if (onSuccess) onSuccess();
    } catch (error) {
      setFormError(error.message);
    } finally {
      setLoading(false);
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
    resetForm();
  };

  const toggleAuthMethod = (newMode) => {
    // Only toggle if the new mode is different from current mode
    if ((newMode === 'phone') === isPhoneAuth) {
      return; // Don't toggle if clicking the current mode
    }
    setIsPhoneAuth(!isPhoneAuth);
    resetForm();
  };

  const resetForm = () => {
    setFormError('');
    setFormData({
      email: '',
      password: '',
      confirmPassword: '',
      displayName: '',
      phoneNumber: '',
      verificationCode: ''
    });
    setFieldErrors({
      email: '',
      password: '',
      confirmPassword: '',
      phoneNumber: ''
    });
    setShowVerificationCode(false);
    setConfirmationResult(null);
    setResendTimer(0);
    setLastPhoneNumber('');
  };

  return {
    isLogin,
    isPhoneAuth,
    showResetPassword,
    showVerificationCode,
    formData,
    formError,
    fieldErrors,
    loading,
    resendTimer,
    lastPhoneNumber,
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
  };
} 