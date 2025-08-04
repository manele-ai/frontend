import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from './AuthContext';
import './UserMenu.css';

export default function UserMenu() {
  const { user, userProfile, signOut, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef(null);

  // Close menu when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleSignOut = async () => {
    try {
      await signOut();
      navigate('/');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const handleProfileClick = () => {
    setIsOpen(false);
    navigate('/profile');
  };



  const handleLeaderboardClick = () => {
    setIsOpen(false);
    navigate('/leaderboard');
  };

  const handleAuthClick = () => {
    navigate('/auth');
  };

  const displayName = userProfile?.displayName || user?.displayName || user?.email?.split('@')[0] || 'Utilizator';

  // If not authenticated, show login button
  if (!isAuthenticated) {
    return (
      <button
        className="user-menu-trigger"
        onClick={handleAuthClick}
        aria-label="Conectează-te sau creează cont"
      >
        <div className="user-avatar-placeholder">?</div>
        <span className="user-name">Conectează-te</span>
      </button>
    );
  }

  return (
    <div className="user-menu" ref={menuRef}>
      <button
        className="user-menu-trigger"
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Deschide meniul utilizatorului"
      >
        {userProfile?.photoURL ? (
          <img 
            src={userProfile.photoURL} 
            alt={displayName}
            className="user-avatar"
          />
        ) : (
          <div className="user-avatar-placeholder">
            {displayName.charAt(0).toUpperCase()}
          </div>
        )}
        <span className="user-name">{displayName}</span>
        <span className={`user-menu-arrow ${isOpen ? 'open' : ''}`}>▼</span>
      </button>

      {isOpen && (
        <div className="user-menu-dropdown">
          <div className="user-menu-header">
            <div className="user-info">
              <span className="user-info-name">{displayName}</span>
              <span className="user-info-email">{user?.email}</span>
            </div>
          </div>
          
          <div className="user-menu-items">
            <button 
              className="user-menu-item"
              onClick={handleProfileClick}
              aria-label="Profilul meu"
            >
              <span>👤</span>
              Profilul meu
            </button>
            


            <button 
              className="user-menu-item"
              onClick={handleLeaderboardClick}
              aria-label="Clasament"
            >
              <span>🏆</span>
              Clasament
            </button>
            
            <div className="user-menu-divider"></div>
            
            <button 
              className="user-menu-item user-menu-item-danger"
              onClick={handleSignOut}
              aria-label="Deconectare"
            >
              <span>🚪</span>
              Deconectare
            </button>
          </div>
        </div>
      )}
    </div>
  );
} 