import { useNavigate } from 'react-router-dom';
import UserMenu from '../auth/UserMenu';
import './Header.css';

export default function Header() {
  const navigate = useNavigate();

  const handleLogoClick = () => {
    navigate('/');
  };

  return (
    <header className="app-header">
      <div className="header-content">
        <button 
          className="logo-button"
          onClick={handleLogoClick}
          aria-label="Manele IO - Pagina principală"
        >
          <span className="logo-text">Manele IO</span>
        </button>
        <UserMenu />
      </div>
    </header>
  );
} 