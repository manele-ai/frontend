import { useNavigate } from 'react-router-dom';
// import UserMenu from '../auth/UserMenu';
import './Header.css';

function HeaderMarquee() {
  const marqueeText = '🔥 Mihacea Alexandru e smecherul smecherilor 🔥 ';
  return (
    <div className="header-marquee">
      <div className="marquee-inner">
        <span>{marqueeText.repeat(6)}</span>
        <span>{marqueeText.repeat(6)}</span>
      </div>
    </div>
  );
}

export default function Header() {
  const navigate = useNavigate();

  return (
    <>
      <HeaderMarquee />
      <header className="header">
        <div className="header-left" onClick={() => navigate('/')}
          style={{ cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
          <img
            src="/_LOGO_MANELEIO.svg"
            alt="Manele IO Logo"
            className="header-logo"
          />
        </div>
        
      </header>
    </>
  );
} 