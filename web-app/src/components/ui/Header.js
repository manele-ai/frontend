import { useNavigate } from 'react-router-dom';
// import UserMenu from '../auth/UserMenu';
import './Header.css';

export default function Header() {
  const navigate = useNavigate();

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
      
      <div className="header-right">
        <button 
          className="header-tarife-btn"
          onClick={() => navigate('/tarife')}
        >
          <span className="header-tarife-text">Tarife</span>
        </button>
      </div>
    </header>
  );
} 