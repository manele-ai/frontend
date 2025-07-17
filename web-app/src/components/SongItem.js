import { useState } from 'react';
import '../styles/SongItem.css';
import AudioPlayer from './AudioPlayer';

export default function SongItem({ song, isActive, onPlayPause, onDownload }) {
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
    <div className="song-item">
      <div className="song-info">
        <h3 className="song-title">{song.apiData?.title || 'Manea fără nume'}</h3>
        <p className="song-date">
          Generat pe {song.createdAt ? new Date(song.createdAt.seconds * 1000).toLocaleDateString('ro-RO') : 'data necunoscută'}
        </p>
      </div>

      {audioUrl ? (
        <div className="player-with-download">
          <AudioPlayer
            audioUrl={audioUrl}
            isPlaying={isActive}
            onPlayPause={() => onPlayPause(song)}
            onError={setError}
          />
          {canDownload && (
            <button
              className="download-button"
              onClick={() => onDownload(song)}
              title="Descarcă melodia"
            >
              📥
            </button>
          )}
        </div>
      ) : (
        <p className="status-message">Piesa ta este aproape gata! Mai așteaptă puțin...</p>
      )}

      {error && isActive && (
        <div className="error-message">{error}</div>
      )}
    </div>
  );
} 