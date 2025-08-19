import './GenerateButton.css';
import SoundWave from './SoundWave';

const GenerateButton = ({
  onClick,
  text,
  disabled = false,
  isProcessing = false,
  className = '',
  soundWaveProps = {}
}) => {
  const renderButtonContent = () => {
    if (isProcessing) {
      return <SoundWave {...soundWaveProps} />;
    }
    
    return text;
  };

  return (
    <div className="buttons-container">
      <button 
        className={`hero-btn button generate-button ${className}`}
        onClick={onClick}
        disabled={disabled}
      >
        <span className="hero-btn-text">
          {renderButtonContent()}
        </span>
      </button>
    </div>
  );
};

export default GenerateButton;
