import { useNavigate } from 'react-router-dom';
import './Footer.css';

const Footer = () => {
  const navigate = useNavigate();

  const handleTermsClick = () => {
    navigate('/terms-and-conditions');
  };

  const handlePrivacyClick = () => {
    navigate('/privacy-policy');
  };

  return (
    <footer className="footer">
      <div className="footer-content">
        <div className="footer-logo">
          <img src="/_LOGO_MANELEIO.svg" alt="Manele IO Logo" className="footer-logo-img" />
        </div>
        <div className="footer-text">
          <div className="footer-links">
            <span 
              className="footer-link" 
              onClick={handleTermsClick}
            >
              Termeni si Conditii
            </span>
            {' | '}
            <span 
              className="footer-link" 
              onClick={handlePrivacyClick}
            >
              Politica de confidentialitate
            </span>
          </div>
          <div className="footer-copyright">
            2025 © Toate drepturile sunt rezervate.
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer; 