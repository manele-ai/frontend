import { useEffect, useRef, useState } from 'react';

const ExampleSongsList = () => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentPlayingIndex, setCurrentPlayingIndex] = useState(null);
  const audioRef = useRef(new Audio('/music/mohanveena-indian-guitar-374179.mp3'));

  // Funcție pentru redarea/pauza audio
  const handlePlayClick = (index) => {
    if (currentPlayingIndex === index) {
      // Dacă aceeași piesă este deja în redare, o oprește
      audioRef.current.pause();
      setIsPlaying(false);
      setCurrentPlayingIndex(null);
    } else {
      // Dacă o altă piesă este în redare, o oprește și redă pe cea nouă
      if (currentPlayingIndex !== null) {
        audioRef.current.pause();
      }
      audioRef.current.currentTime = 0;
      audioRef.current.play();
      setIsPlaying(true);
      setCurrentPlayingIndex(index);
    }
  };

  // Event listener pentru când audio-ul se termină
  useEffect(() => {
    const audio = audioRef.current;
    const handleEnded = () => {
      setIsPlaying(false);
      setCurrentPlayingIndex(null);
    };

    audio.addEventListener('ended', handleEnded);
    return () => {
      audio.removeEventListener('ended', handleEnded);
    };
  }, []);

  return (
    <div className="songs-container">
      <h2 className="songs-title">Piese generate</h2>
      <div className="songs-list">
        {[0, 1, 2, 3].map((index) => (
          <div key={index} className="loading-song-item">
            <div className="song-image-placeholder"></div>
            <div className="song-info">
              <div className="song-artist">Manele AI</div>
              <div className="song-name">Mohan Veena - Indian Guitar</div>
            </div>
            <img 
              src="/icons/Play.png" 
              alt="Play" 
              className="play-icon" 
              onClick={() => handlePlayClick(index)}
              style={{ cursor: 'pointer' }}
            />
          </div>
        ))}
      </div>
    </div>
  );
};

export default ExampleSongsList; 