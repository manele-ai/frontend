import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
// import UserMenu from '../auth/UserMenu';
import './Header.css';

export default function Header() {
  const navigate = useNavigate();
  const location = useLocation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const handleNavigation = (route) => {
    navigate(route);
    setIsMenuOpen(false);
  };

  const isActive = (route) => {
    return location.pathname === route;
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
        <nav className="desktop-nav">
          <button 
            className={`desktop-nav-btn ${isActive('/') ? 'active' : ''}`}
            onClick={() => handleNavigation('/')}
          >
            <span className="desktop-nav-text">ACASA</span>
          </button>
          <button 
            className={`desktop-nav-btn generate-btn ${isActive('/select-style') ? 'active' : ''}`}
            onClick={() => handleNavigation('/select-style')}
          >
            <span className="desktop-nav-text">GENEREAZA</span>
          </button>
          <button 
            className={`desktop-nav-btn ${isActive('/leaderboard') ? 'active' : ''}`}
            onClick={() => handleNavigation('/leaderboard')}
          >
            <span className="desktop-nav-text">TOPUL MANELISTILOR</span>
          </button>
          <button 
            className={`desktop-nav-btn ${isActive('/profile') ? 'active' : ''}`}
            onClick={() => handleNavigation('/profile')}
          >
            <span className="desktop-nav-text">PROFIL</span>
          </button>
          <button 
            className={`desktop-nav-btn ${isActive('/tarife') ? 'active' : ''}`}
            onClick={() => handleNavigation('/tarife')}
          >
            <span className="desktop-nav-text">TARIFE</span>
          </button>
        </nav>
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
            className={`mobile-nav-btn ${isActive('/') ? 'active' : ''}`}
            onClick={() => handleNavigation('/')}
          >
            <span className="mobile-nav-text">ACASA</span>
          </button>
          <button 
            className={`mobile-nav-btn ${isActive('/leaderboard') ? 'active' : ''}`}
            onClick={() => handleNavigation('/leaderboard')}
          >
            <span className="mobile-nav-text">TOPUL MANELISTILOR</span>
          </button>
          <button 
            className={`mobile-nav-btn ${isActive('/profile') ? 'active' : ''}`}
            onClick={() => handleNavigation('/profile')}
          >
            <span className="mobile-nav-text">PROFIL</span>
          </button>
          <button 
            className={`mobile-nav-btn ${isActive('/tarife') ? 'active' : ''}`}
            onClick={() => handleNavigation('/tarife')}
          >
            <span className="mobile-nav-text">TARIFE</span>
          </button>
        </div>
      </div>
    </header>
  );
} 