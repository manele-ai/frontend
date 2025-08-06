import { useState } from 'react';
import '../styles/SongItem.css';
import AudioPlayer from './AudioPlayer';

export default function SongItem({ song, isActive, onPlayPause, onDownload, styleLabel }) {
  const [error, setError] = useState(null);

  // Get the appropriate audio URL based on availability
  const getAudioUrl = () => {
    if (song.storage?.url) {
      return song.storage.url;
    }
    if (song.apiData?.audioUrl) {
      return song.apiData.audioUrl;
    }
    if (song.apiData?.streamAudioUrl) {
      console.log("song.apiData.streamAudioUrl", song.apiData.streamAudioUrl);
      return song.apiData.streamAudioUrl;
    }
    return null;
  };

  const audioUrl = getAudioUrl();
  const canDownload = song.storage?.url || song.apiData?.audioUrl;

  return (
    <div className="song-item song-row-layout">
      <div className="song-info-row">
        <img
          className="song-cover"
          src={song.apiData?.imageUrl || 'https://via.placeholder.com/48'}
          alt="cover"
          width={48}
          height={48}
        />
        <div className="song-title-style-col">
          <span className="song-title song-title-inline">{song.apiData?.title || 'Manea fără nume'}</span>
          {styleLabel && (
            <span className="song-style-label">{styleLabel}</span>
          )}
        </div>
      </div>
      {audioUrl && (
        <div className="song-playback-inline song-playback-left">
          <AudioPlayer
            audioUrl={audioUrl}
            isPlaying={isActive}
            onPlayPause={() => onPlayPause(song)}
            onError={setError}
          />
        </div>
      )}
      {(!audioUrl) && (
        <p className="status-message">Piesa ta este aproape gata! Mai așteaptă puțin...</p>
      )}
      {error && isActive && (
        <div className="error-message">{error}</div>
      )}
    </div>
  );
} 