import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import ComplexModeForm from '../components/ComplexModeForm';
import EasyModeForm from '../components/EasyModeForm';
import '../styles/GeneratePage.css';

export default function GeneratePage() {
  const [mode, setMode] = useState('hard');
  const navigate = useNavigate();

  const handleBack = () => {
    navigate('/');
  };

  return (
    <div 
      className="generate-page"
      style={{
        backgroundImage: 'url(/backgrounds/patternFudalSecond.svg)',
        backgroundSize: '30%',
        backgroundPosition: '0 0',
        backgroundRepeat: 'repeat',
      }}
    >
      {/* Hero Section */}
      <div className="hero-section">
        <div className="hero-card">
          <div className="hero-card-content">
            <h2 className="hero-title">Configureaza maneaua</h2>
            <p className="hero-subtitle">Genereaza-ti propria manea in cateva minute cu ajutorul aplicatiei noastre.</p>
          </div>
        </div>
      </div>

      {/* Main Content Container */}
      <div className="main-content-container">
        {/* Mode Slider */}
        <div className="mode-slider-container">
          <div className="mode-slider">
            <button
              className={`mode-slider-option ${mode === 'hard' ? 'active' : ''}`}
              onClick={() => setMode('hard')}
            >
              <span className="mode-slider-text">Complex</span>
            </button>
            <button
              className={`mode-slider-option ${mode === 'easy' ? 'active' : ''}`}
              onClick={() => setMode('easy')}
            >
              <span className="mode-slider-text">Easy</span>
            </button>
          </div>
        </div>

        {/* Render appropriate form based on mode */}
        {mode === 'easy' ? (
          <EasyModeForm onBack={handleBack} />
        ) : (
          <ComplexModeForm onBack={handleBack} />
        )}
      </div>
    </div>
  );
} 