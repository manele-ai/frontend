import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
// import UserMenu from '../auth/UserMenu';
import './Header.css';

export default function Header() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, isAuthenticated } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  
  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const handleNavigation = (route) => {
    if (route === location.pathname) {
      setIsMenuOpen(false);
      return;
    }
    navigate(route);
    setIsMenuOpen(false);
  };

  const isActive = (route) => {
    if (route === '/profile' && !isAuthenticated) {
      return location.pathname === '/auth';
    }
    return location.pathname === route;
  };

  return (
    <header className="header">
      <div className="header-left" onClick={() => handleNavigation('/')}
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
            className={`desktop-nav-btn ${isActive('/tarife') ? 'active' : ''}`}
            onClick={() => handleNavigation('/tarife')}
          >
            <span className="desktop-nav-text">TARIFE</span>
          </button>
          <button 
            className={`desktop-nav-btn ${isActive('/profile') ? 'active' : ''}`}
            onClick={() => handleNavigation(isAuthenticated ? '/profile' : '/auth')}
          >
            <span className="desktop-nav-text">{isAuthenticated ? 'PROFIL' : 'LOGIN/REGISTER'}</span>
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
            className={`mobile-nav-btn ${isActive('/tarife') ? 'active' : ''}`}
            onClick={() => handleNavigation('/tarife')}
          >
            <span className="mobile-nav-text">TARIFE</span>
          </button>
          <button 
            className={`mobile-nav-btn ${isActive('/profile') ? 'active' : ''}`}
            onClick={() => handleNavigation(isAuthenticated ? '/profile' : '/auth')}
          >
            <span className="mobile-nav-text">{isAuthenticated ? 'PROFIL' : 'LOGIN/REGISTER'}</span>
          </button>
        </div>
      </div>
    </header>
  );
} 