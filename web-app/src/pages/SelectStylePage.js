import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/SelectStylePage.css';

const styles = [
  { title: 'JALE', subtitle: 'Guta/Salam vechi', image: '/photos/Jale.png' },
  { title: 'COMERCIALE', subtitle: 'BDLP', image: '/photos/Frame 63.png' },
  { title: 'DE PETRECERE', subtitle: 'Bem 7 zile', image: '/photos/Frame 64.png' },
  { title: 'MUZICA POPULARA', subtitle: '', image: '/photos/Frame 63.1.png' },
  { title: 'MANELE LIVE', subtitle: '', image: '/photos/Frame 63.2.png' },
  { title: 'DE OPULENTA', subtitle: '', image: '/photos/Frame 55.png' },
  { title: 'ORIENTALE', subtitle: '', image: '/photos/Orieltala.png' },
  { title: 'LAUTARESTI', subtitle: '', image: '/photos/Frame 63.3.png' },
];

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
      style={{ backgroundImage: `url(${encodeURI(image)})`, cursor: 'pointer' }}
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
      navigate('/generate');
    }
  };

  return (
    <div className="home-page select-style-page">
      <div className="container">
        <HeroCard />
        <div className="styles-grid">
          {styles.map((style) => (
            <StyleCard
              key={style.title}
              {...style}
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
        {/* Exemplu: afișează stilul selectat */}
        {selectedStyle && (
          <div style={{ textAlign: 'center', marginTop: 24, fontWeight: 600, color: '#eab111' }}>
            Stil selectat: {selectedStyle}
          </div>
        )}
      </div>
    </div>
  );
} 