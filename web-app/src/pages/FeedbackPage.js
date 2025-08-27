import { httpsCallable } from 'firebase/functions';
import { useState } from 'react';
import { functions } from '../services/firebase';
import '../styles/FeedbackPage.css';

const FeedbackPage = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    songTitle: '',
    rating: 0,
    feedback: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState(null);

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
        name: formData.name,
        email: formData.email,
        songTitle: formData.songTitle,
        rating: formData.rating,
        feedback: formData.feedback
      });
      
      setSubmitStatus('success');
      setFormData({
        name: '',
        email: '',
        songTitle: '',
        rating: 0,
        feedback: ''
      });
    } catch (error) {
      console.error('Error submitting feedback:', error);
      setSubmitStatus('error');
    } finally {
      setIsSubmitting(false);
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

  return (
    <div 
      className="feedback-wrapper"
      style={{
        backgroundImage: 'url(/backgrounds/patternFudalSecond.svg)',
        backgroundSize: '30%',
        backgroundPosition: '0 0',
        backgroundRepeat: 'repeat',
      }}
    >
      <div className="feedback-container">
        <h1 className="feedback-heading">Feedback pentru Piesele Generate</h1>
        <p className="feedback-subtitle">
          Ajută-ne să îmbunătățim serviciul nostru! Spune-ne ce părere ai despre piesele generate.
        </p>

        <form className="feedback-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="name" className="form-label">Numele tău *</label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              className="form-input"
              required
              disabled={isSubmitting}
              placeholder="Introdu numele tău"
            />
          </div>

          <div className="form-group">
            <label htmlFor="email" className="form-label">Email *</label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleInputChange}
              className="form-input"
              required
              disabled={isSubmitting}
              placeholder="Introdu adresa ta de email"
            />
          </div>

          <div className="form-group">
            <label htmlFor="songTitle" className="form-label">Titlul piesei (opțional)</label>
            <input
              type="text"
              id="songTitle"
              name="songTitle"
              value={formData.songTitle}
              onChange={handleInputChange}
              className="form-input"
              disabled={isSubmitting}
              placeholder="Titlul piesei pentru care dai feedback"
            />
          </div>

          <div className="form-group">
            <label className="form-label">Rating *</label>
            <div className="rating-container">
              {renderStars()}
              <span className="rating-text">
                {formData.rating > 0 ? `${formData.rating} stele` : 'Selectează rating-ul'}
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
              placeholder="Spune-ne ce părere ai despre piesele generate, ce ai dori să îmbunătățim, sau orice alte sugestii..."
              rows={5}
            />
          </div>

          {submitStatus === 'success' && (
            <div className="success-message">
              Mulțumim pentru feedback! Mesajul tău a fost trimis cu succes și va apărea în Google Sheets.
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
            disabled={isSubmitting || !formData.name || !formData.email || !formData.rating || !formData.feedback}
          >
            {isSubmitting ? 'Se trimite...' : 'Trimite Feedback'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default FeedbackPage;
