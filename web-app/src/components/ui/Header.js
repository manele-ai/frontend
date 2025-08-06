import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
// import UserMenu from '../auth/UserMenu';
import './Header.css';

export default function Header() {
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const handleTarifeClick = () => {
    navigate('/tarife');
    setIsMenuOpen(false);
  };

  return (
    <header className="header">
      <div className="header-left" onClick={() => navigate('/')}
        style={{ cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
        <img
          src="/_LOGO_MANELEIO.svg"
          alt="Manele IO Logo"
          className="header-logo"
        />
      </div>
      
      {/* Desktop menu */}
      <div className="header-right desktop-menu">
        <button 
          className="header-tarife-btn"
          onClick={() => navigate('/tarife')}
        >
          <span className="header-tarife-text">Tarife</span>
        </button>
      </div>

      {/* Mobile hamburger menu */}
      <div className="mobile-menu">
        <button 
          className={`hamburger-btn ${isMenuOpen ? 'active' : ''}`}
          onClick={toggleMenu}
          aria-label="Toggle menu"
        >
          <span className="hamburger-line"></span>
          <span className="hamburger-line"></span>
          <span className="hamburger-line"></span>
        </button>
        
        <div className={`mobile-dropdown ${isMenuOpen ? 'open' : ''}`}>
          <button 
            className="mobile-tarife-btn"
            onClick={handleTarifeClick}
          >
            <span className="mobile-tarife-text">Tarife</span>
          </button>
        </div>
      </div>
    </header>
  );
} 