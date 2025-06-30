import { useEffect, useRef, useState } from 'react';
import '../styles/SongItem.css';

export default function SongItem({ song, isActive, onPlayPause, onDownload }) {
  const audioRef = useRef(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const audio = audioRef.current;

    const handleTimeUpdate = () => {
      setCurrentTime(audio.currentTime);
    };

    const handleLoadedMetadata = () => {
      setDuration(audio.duration);
      setIsLoading(false);
    };

    const handleEnded = () => {
      onPlayPause(song);
      setCurrentTime(0);
    };

    const handleError = (e) => {
      // Only show error if we're actually trying to play
      if (isActive) {
        console.error('Audio playback error:', e);
        setError('Error playing audio. Please try again.');
      }
      setIsLoading(false);
    };

    const handleCanPlay = () => {
      setIsLoading(false);
      if (isActive) {
        audio.play().catch(() => {
          // Only show error if play() fails
          setError('Error playing audio. Please try again.');
        });
      }
    };

    const handleWaiting = () => {
      setIsLoading(true);
    };

    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('error', handleError);
    audio.addEventListener('canplay', handleCanPlay);
    audio.addEventListener('waiting', handleWaiting);

    // Load or unload audio based on active state
    if (isActive) {
      setError(null);
      setIsLoading(true);
      audio.src = song.audioUrl;
      audio.load();
    } else {
      audio.pause();
      audio.src = '';
      setCurrentTime(0);
      setError(null);
      setIsLoading(false);
    }

    return () => {
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('error', handleError);
      audio.removeEventListener('canplay', handleCanPlay);
      audio.removeEventListener('waiting', handleWaiting);
      audio.pause();
      audio.src = '';
    };
  }, [song.audioUrl, isActive, song]);

  const handleSeek = (e) => {
    const newTime = e.target.value;
    audioRef.current.currentTime = newTime;
    setCurrentTime(newTime);
  };

  const formatTime = (time) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  return (
    <div className="song-item">
      <audio ref={audioRef} />
      
      <div className="song-header">
        <h3 className="song-title">{song.title || 'Manea fără nume'}</h3>
        <p className="song-date">
          Generat pe {song.createTime ? new Date(song.createTime).toLocaleDateString('ro-RO') : 'data necunoscută'}
        </p>
      </div>

      <div className="song-playback">
        <div className="player-controls">
          <button 
            className="play-pause-button" 
            onClick={() => onPlayPause(song)}
            disabled={isLoading}
          >
            {isLoading ? '⌛' : isActive ? '⏸️' : '▶️'}
          </button>
          
          <div className="progress-container">
            <input
              type="range"
              min="0"
              max={duration || 0}
              value={currentTime}
              onChange={handleSeek}
              className="progress-bar"
              disabled={!isActive || isLoading}
            />
            <div className="time-display">
              <span>{formatTime(currentTime)}</span>
              <span>{formatTime(duration)}</span>
            </div>
          </div>
        </div>

        <button
          className="download-button"
          onClick={() => onDownload(song)}
          title="Descarcă melodia"
        >
          📥
        </button>
      </div>

      {error && isActive && (
        <div className="error-message">{error}</div>
      )}
    </div>
  );
} 