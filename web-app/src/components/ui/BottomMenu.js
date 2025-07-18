import { useLocation, useNavigate } from 'react-router-dom';
import './BottomMenu.css';

const ICONS = [
  { src: '/icons/home-09.png', alt: 'Home', route: '/' },
  { src: '/icons/Vector-1.png', alt: 'Plus', route: '/select-style' },
  { src: '/icons/Vector.png', alt: 'Leaderboard', route: '/leaderboard' },
  { src: '/icons/user.png', alt: 'Profil', route: '/profile' },
];

export default function BottomMenu() {
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <nav className="bottom-menu">
      {ICONS.map((icon, idx) => (
        <button
          key={icon.alt}
          className={`bottom-menu-btn${idx === 1 ? ' plus-btn' : ''}${location.pathname === icon.route ? ' active' : ''}`}
          onClick={() => navigate(icon.route)}
          aria-label={icon.alt}
        >
          <img src={icon.src} alt={icon.alt} className="bottom-menu-icon" />
        </button>
      ))}
    </nav>
  );
} 