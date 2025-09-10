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
          <div className="footer-social">
            <a 
              href="https://www.instagram.com/manele.io?igsh=MXJ3OTRwYzA4YWI1eA==" 
              target="_blank" 
              rel="noopener noreferrer"
              className="social-link"
              aria-label="Instagram"
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="2" y="2" width="20" height="20" rx="5" ry="5"/>
                <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/>
                <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/>
              </svg>
            </a>
            <a 
              href="https://www.facebook.com/share/16upp1Q44i/?mibextid=wwXIfr" 
              target="_blank" 
              rel="noopener noreferrer"
              className="social-link"
              aria-label="Facebook"
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/>
              </svg>
            </a>
            <a 
              href="https://www.tiktok.com/@manele.io?_t=ZN-8zcBwlSgoVy&_r=1" 
              target="_blank" 
              rel="noopener noreferrer"
              className="social-link"
              aria-label="TikTok"
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z"/>
              </svg>
            </a>
            <a 
              href="https://youtube.com/@maneleioofficial?si=O7Xx6GjJ2ibmvffy" 
              target="_blank" 
              rel="noopener noreferrer"
              className="social-link"
              aria-label="YouTube"
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22.54 6.42a2.78 2.78 0 0 0-1.94-2C18.88 4 12 4 12 4s-6.88 0-8.6.46a2.78 2.78 0 0 0-1.94 2A29 29 0 0 0 1 11.75a29 29 0 0 0 .46 5.33A2.78 2.78 0 0 0 3.4 19c1.72.46 8.6.46 8.6.46s6.88 0 8.6-.46a2.78 2.78 0 0 0 1.94-2 29 29 0 0 0 .46-5.25 29 29 0 0 0-.46-5.33z"/>
                <polygon points="9.75,15.02 15.5,11.75 9.75,8.48"/>
              </svg>
            </a>
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