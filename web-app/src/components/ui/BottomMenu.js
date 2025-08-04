import { useLocation, useNavigate } from 'react-router-dom';
import './BottomMenu.css';

const ICONS = [
  { src: '/icons/home-09.png', alt: 'Home', route: '/' },
  { src: '/icons/Vector-1.png', alt: 'Plus', route: '/generate' },
  { src: '/icons/Vector.png', alt: 'Leaderboard', route: '/leaderboard' },
  { src: '/icons/user.png', alt: 'Profil', route: '/profile' },
];

export default function BottomMenu() {
  const navigate = useNavigate();
  const location = useLocation();

  const handleNavigation = (route) => {
    // If it's the plus button, check if there's an active generation
    if (route === '/generate') {
      const saved = localStorage.getItem('generationState');
      if (saved) {
        const parsed = JSON.parse(saved);
        // If there's an active generation, go to result page
        if (parsed.isGenerating && parsed.generationRequestId) {
          navigate('/result', { 
            state: { 
              requestId: parsed.generationRequestId, 
              songId: parsed.generationSongId 
            } 
          });
          return;
        }
      }
    }
    // Otherwise, navigate normally
    navigate(route);
  };

  return (
    <nav className="bottom-menu">
      {ICONS.map((icon, idx) => (
        <button
          key={icon.alt}
          className={`bottom-menu-btn${idx === 1 ? ' plus-btn' : ''}${location.pathname === icon.route ? ' active' : ''}`}
          onClick={() => handleNavigation(icon.route)}
          aria-label={icon.alt}
        >
          <img src={icon.src} alt={icon.alt} className="bottom-menu-icon" />
        </button>
      ))}
    </nav>
  );
} 