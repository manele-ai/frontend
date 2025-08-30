import { useState } from 'react';
import useAudioPlayer from '../../hooks/useAudioPlayer';
import '../../styles/SongItem.css';

interface AudioPlayerProps {
  songId: string;
  urls: {
    streamAudioUrl?: string;
    audioUrl?: string;
    storageUrl?: string;
  }
  resolveUrlFn?: (url: string) => Promise<string>;
}

export default function AudioPlayer(props: AudioPlayerProps) {
  const { songId, urls, resolveUrlFn } = props;

  // const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
  // const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
  const {
    play,
    pause,
    seek,
    audioError,
    isActive,
    isPlaying,
    isLoading,
    duration,
    currentTime,
    url,
    resolveUrlError,
    isResolvingUrl,
  } = useAudioPlayer({ songId, urls, resolveUrlFn });

  const error = audioError || resolveUrlError;

  // Prevent slider from jittering while dragging
  const [isScrubbing, setIsScrubbing] = useState(false);
  const [scrubValue, setScrubValue] = useState(0);
  const displayTime = isScrubbing ? scrubValue : currentTime;

  const onThumbCommit = (value: number) => {
    setIsScrubbing(false);
    seek(value);
  }

  const formatTime = (time: number) => {
    if (typeof time !== 'number' || isNaN(time) || !isFinite(time)) return '0:00';
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const formatDuration = (time: number) => {
    if (typeof time !== 'number' || isNaN(time) || !isFinite(time) || time <= 0) return '';
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  return (
    <div className="song-playback">      
      <div className="song-slider-row">
        <button 
          className="play-pause-button" 
          onClick={isPlaying ? pause : play}
          disabled={isLoading}
        >
          {isLoading ? (
            <div className="loading-spinner">
            </div>
          ) : (
            isPlaying ? (
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <defs>
                  <linearGradient id="pauseGradient" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor="#ffeecc" />
                    <stop offset="100%" stopColor="#cfaf6e" />
                  </linearGradient>
                </defs>
                <rect x="6" y="5" width="4" height="14" rx="2" fill="url(#pauseGradient)" />
                <rect x="14" y="5" width="4" height="14" rx="2" fill="url(#pauseGradient)" />
              </svg>
            ) : (
              <img src="/icons/Play.png" alt="Play" className="play-icon" style={{ width: 24, height: 24 }} />
            )
          )}
        </button>
        <span className="time-display time-current">{formatTime(displayTime)}</span>
        <input
          type="range"
          min={0}
          max={Math.max(0, Math.floor(duration))}
          value={Math.floor(isScrubbing ? scrubValue : currentTime)}
          onChange={(e) => {
            setIsScrubbing(true);
            setScrubValue(e.currentTarget.valueAsNumber);
          }}
          // Works for mouse, touch, pen in modern browsers
          onPointerUp={(e) => { onThumbCommit(e.currentTarget.valueAsNumber); }}
          // Fallback for older browsers that don't support Pointer Events
          onMouseUp={(e) => { onThumbCommit(e.currentTarget.valueAsNumber); }}
          onTouchEnd={(e) => { onThumbCommit(e.currentTarget.valueAsNumber); }}
          // Commit when slider loses focus / keyboard interactions
          onKeyUp={(e) => {
            if (e.key === 'Enter' || e.key === ' ') onThumbCommit(e.currentTarget.valueAsNumber);
          }}
          onBlur={(e) => {
            if (isScrubbing) onThumbCommit(e.currentTarget.valueAsNumber);
          }}
          className="progress-bar"
          disabled={isLoading || !isActive}
          style={{ flex: 1, minWidth: 80, maxWidth: 360 }}
        />
        {formatDuration(duration) && (
          <span className="time-display time-duration">{formatDuration(duration)}</span>
        )}
      </div>

      {error && (
        <div className="error-message">
          {error}
        </div>
      )}
    </div>
  );
} 