import './Footer.css';

const Footer = () => {
  return (
    <footer className="footer">
      <div className="footer-content">
        <div className="footer-logo">
          <img src="/_LOGO_MANELEIO.svg" alt="Manele IO Logo" className="footer-logo-img" />
        </div>
        <div className="footer-text">
          <div className="footer-links">
            Termeni si Conditii | Politica de confidentialitate
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