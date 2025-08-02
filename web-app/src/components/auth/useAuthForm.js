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
  const { signUp, signIn, signInWithGoogle, resetPassword } = useAuth();
  const [isLogin, setIsLogin] = useState(true);
  const [showResetPassword, setShowResetPassword] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    displayName: ''
  });
  const [formError, setFormError] = useState('');
  const [loading, setLoading] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({
    email: '',
    password: '',
    confirmPassword: ''
  });

  // Email validation with debounce
  useEffect(() => {
    if (!formData.email || isLogin) return;
    
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
  }, [formData.email, isLogin]);

  // Password validation with debounce
  useEffect(() => {
    if (!formData.password || isLogin) return;
    
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
  }, [formData.password, isLogin]);

  // Confirm password validation with debounce
  useEffect(() => {
    if (!formData.confirmPassword || isLogin) return;
    
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
  }, [formData.confirmPassword, formData.password, isLogin]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    setFormError('');
  };

  const validateForm = () => {
    if (!formData.email || !formData.password) {
      setFormError('Toate câmpurile sunt obligatorii.');
      return false;
    }
    if (!isLogin) {
      // Check for field errors
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
      if (isLogin) {
        await signIn(formData.email, formData.password);
      } else {
        await signUp(formData.email, formData.password, formData.displayName);
      }
      
      if (onClose) onClose();
      resetForm();
      if (onSuccess) onSuccess();
      
    } catch (error) {
      setFormError(error.message);
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

  const resetForm = () => {
    setFormError('');
    setFormData({
      email: '',
      password: '',
      confirmPassword: '',
      displayName: ''
    });
  };

  return {
    isLogin,
    showResetPassword,
    formData,
    formError,
    fieldErrors,
    loading,
    setShowResetPassword,
    handleInputChange,
    handleAuthSubmit,
    handleGoogleSignIn,
    handleResetPassword,
    toggleMode,
    resetForm
  };
} 