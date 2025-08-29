import { httpsCallable } from 'firebase/functions';
import { useState } from 'react';
import { createPortal } from 'react-dom';
import { functions } from '../services/firebase';
import { useAuth } from './auth/AuthContext';
import './FeedbackModal.css';

export default function FeedbackModal({ isOpen, onClose, songTitle }) {
  const { user, userProfile } = useAuth();
  
  const [formData, setFormData] = useState({
    rating: 0,
    feedback: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState(null);

  // Pre-fill user information from context
  const userName = userProfile?.displayName || user?.displayName || user?.email?.split('@')[0] || '';
  const userEmail = user?.email || '';

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleRatingChange = (rating) => {
    setFormData(prev => ({
      ...prev,
      rating
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitStatus(null);

    try {
      const submitFeedback = httpsCallable(functions, 'submitFeedback');
      const result = await submitFeedback({
        name: userName,
        email: userEmail,
        songTitle: songTitle || '',
        rating: formData.rating,
        feedback: formData.feedback
      });
      
      setSubmitStatus('success');
      // Reset form after successful submission
      setFormData({
        rating: 0,
        feedback: ''
      });
      
      // Close modal after a short delay
      setTimeout(() => {
        onClose();
        setSubmitStatus(null);
      }, 2000);
    } catch (error) {
      console.error('Error submitting feedback:', error);
      setSubmitStatus('error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const renderStars = () => {
    return [1, 2, 3, 4, 5].map(star => (
      <button
        key={star}
        type="button"
        className={`star-button ${formData.rating >= star ? 'star-filled' : 'star-empty'}`}
        onClick={() => handleRatingChange(star)}
        disabled={isSubmitting}
      >
        ★
      </button>
    ));
  };

  if (!isOpen) return null;

  return createPortal(
    <div className="feedback-modal-overlay" onClick={handleOverlayClick}>
      <div className="feedback-modal">
        <button className="feedback-modal-close" onClick={onClose}>×</button>
        
        <div className="feedback-modal-content">
          <h2 className="feedback-modal-title">Lasa recenzie</h2>
          <p className="feedback-modal-subtitle">
            Ajută-ne să îmbunătățim serviciul nostru! Spune-ne ce părere ai despre piesa generată.
          </p>

          {/* Pre-filled user information display */}
          <div className="user-info-display">
            <div className="user-info-item">
              <span className="user-info-label">Nume:</span>
              <span className="user-info-value">{userName}</span>
            </div>
            <div className="user-info-item">
              <span className="user-info-label">Email:</span>
              <span className="user-info-value">{userEmail}</span>
            </div>
            {songTitle && (
              <div className="user-info-item">
                <span className="user-info-label">Piesa:</span>
                <span className="user-info-value">{songTitle}</span>
              </div>
            )}
          </div>

          <form className="feedback-modal-form" onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">Rating *</label>
              <div className="rating-container">
                {renderStars()}
                <span className="rating-text">
                  {formData.rating > 0 ? `${formData.rating} stele` : 'Selectează rating'}
                </span>
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="feedback" className="form-label">Feedback *</label>
              <textarea
                id="feedback"
                name="feedback"
                value={formData.feedback}
                onChange={handleInputChange}
                className="form-textarea"
                required
                disabled={isSubmitting}
                placeholder="Spune-ne ce părere ai despre piesa generată..."
                rows={4}
              />
            </div>

            {submitStatus === 'success' && (
              <div className="success-message">
                Feedback trimis cu succes! Mulțumim!
              </div>
            )}

            {submitStatus === 'error' && (
              <div className="error-message">
                A apărut o eroare la trimiterea feedback-ului. Te rugăm să încerci din nou.
              </div>
            )}

            <button
              type="submit"
              className="submit-button"
              disabled={isSubmitting || !formData.rating || !formData.feedback}
            >
              {isSubmitting ? 'Se trimite...' : 'Trimite Feedback'}
            </button>
          </form>
        </div>
      </div>
    </div>,
    document.body
  );
}
