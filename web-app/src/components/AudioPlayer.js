import { useEffect, useRef, useState } from 'react';
import '../styles/AudioPlayer.css';

export default function AudioPlayer({ song, onClose }) {
  const audioRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
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
      setIsPlaying(false);
      setCurrentTime(0);
    };

    const handleError = (e) => {
      console.error('Audio playback error:', e);
      setError('Error playing audio. Please try again.');
      setIsLoading(false);
    };

    const handleCanPlay = () => {
      setIsLoading(false);
      if (isPlaying) {
        audio.play().catch(handleError);
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

    // Load the audio source
    audio.src = song.audioUrl;
    audio.load();

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
  }, [song.audioUrl, isPlaying]);

  const togglePlayPause = () => {
    if (isLoading) return;

    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play().catch(e => {
        console.error('Error playing audio:', e);
        setError('Error playing audio. Please try again.');
      });
    }
    setIsPlaying(!isPlaying);
  };

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
    <div className="audio-player">
      <audio ref={audioRef} />
      
      <div className="player-header">
        <h3 className="song-title">{song.title || 'Manea fără nume'}</h3>
        <button className="close-button" onClick={onClose}>×</button>
      </div>

      {error ? (
        <div className="error-message">{error}</div>
      ) : (
        <>
          <div className="player-controls">
            <button 
              className="play-pause-button" 
              onClick={togglePlayPause}
              disabled={isLoading}
            >
              {isLoading ? '⌛' : isPlaying ? '⏸️' : '▶️'}
            </button>
            
            <div className="progress-container">
              <input
                type="range"
                min="0"
                max={duration || 0}
                value={currentTime}
                onChange={handleSeek}
                className="progress-bar"
                disabled={isLoading}
              />
              <div className="time-display">
                <span>{formatTime(currentTime)}</span>
                <span>{formatTime(duration)}</span>
              </div>
            </div>
          </div>

          {isLoading && (
            <div className="loading-indicator">
              <div className="spinner"></div>
              <span>Loading...</span>
            </div>
          )}
        </>
      )}
    </div>
  );
} 