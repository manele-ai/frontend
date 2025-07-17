import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { styles } from '../data/stylesData';
import '../styles/SelectStylePage.css';

function HeroCard() {
  return (
    <div className="hero-card">
      <div className="hero-card-content">
        <h2 className="hero-title">Alege stilul dorit</h2>
        <p className="hero-subtitle">Genereaza-ti propria manea in cateva minute cu ajutorul aplicatiei noastre.</p>
      </div>
      <div className="hero-card-img">
        <div className="ellipse-bg"></div>
        <img src="/icons/Microphone.png" alt="Microfon" className="hero-icon" />
      </div>
    </div>
  );
}

function StyleCard({ title, subtitle, image, selected, onClick }) {
  return (
    <div
      className={`style-card${selected ? ' selected' : ''}`}
      style={{ backgroundImage: `url(${image})` }}
      onClick={onClick}
      tabIndex={0}
      role="button"
      aria-pressed={selected}
    >
      <div className="style-card-overlay">
        <div className="style-card-title">{title}</div>
        {subtitle && <div className="style-card-subtitle">{subtitle}</div>}
      </div>
    </div>
  );
}

export default function SelectStylePage() {
  const [selectedStyle, setSelectedStyle] = useState(null);
  const navigate = useNavigate();

  const handleContinue = () => {
    if (selectedStyle) {
      navigate('/generate', {
        state: { selectedStyle }
      });
    }
  };

  return (
    <div className="home-page select-style-page">
      {/* Hero Section */}
      <div className="hero-section">
        <HeroCard />
      </div>

      {/* Main Content Container */}
      <div className="main-content-container">
        <div className="styles-grid">
          {styles.map((style) => (
            <StyleCard
              key={style.title}
              title={style.title}
              subtitle={style.subtitle}
              image={style.image}
              selected={selectedStyle === style.title}
              onClick={() => setSelectedStyle(style.title)}
            />
          ))}
        </div>
        <button
          className="select-style-continue-btn"
          disabled={!selectedStyle}
          onClick={handleContinue}
        >
          Continuă
        </button>
        
      </div>
    </div>
  );
} 