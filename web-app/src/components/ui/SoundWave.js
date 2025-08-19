import './SoundWave.css';

const SoundWave = ({
  className = '',
  size = 'large',
  color = '#FFE0A1',
  speed = 1.2,
  bars = 6
}) => {
  const renderBars = () => {
    const delayIncrement = speed / (bars + 2); // Dynamic delay based on speed and number of bars
    
    return Array.from({ length: bars }, (_, index) => (
      <div 
        key={index}
        className="wave-bar" 
        style={{
          backgroundColor: color,
          animationDuration: `${speed}s`,
          animationDelay: `${index * delayIncrement}s`
        }}
      />
    ));
  };

  return (
    <div className={`sound-wave-container ${size} ${className}`}>
      <div className="sound-wave">
        {renderBars()}
      </div>
    </div>
  );
};

export default SoundWave;
