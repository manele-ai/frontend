import '../styles/SongItem.css';
import AudioPlayer from './audio/AudioPlayer';

interface SongItemProps {
  song: {
    id: string;
    apiData: {
      streamAudioUrl: string;
      audioUrl: string;
      imageUrl: string;
      title: string;
    };
    storage: {
      url: string;
    };
  };
  styleLabel?: string | null;
}

export default function SongItem({ song, styleLabel }: SongItemProps) {
  const streamAudioUrl = song.apiData?.streamAudioUrl;
  const audioUrl = song.apiData?.audioUrl;
  const storageUrl = song.storage?.url;
  const imageUrl = song.apiData?.imageUrl;
  const title = song.apiData?.title;

  const hasAtLeastOneUrl = storageUrl || audioUrl || streamAudioUrl;

  return (
    <div className="song-item song-row-layout">
      <div className="song-info-row">
        <img
          className="song-cover"
          src={imageUrl || 'https://via.placeholder.com/48'}
          alt="cover"
          width={48}
          height={48}
        />
        <div className="song-title-style-col">
          <span className="song-title song-title-inline">{title || 'Manea fără nume'}</span>
          {styleLabel && (
            <span className="song-style-label">{styleLabel}</span>
          )}
        </div>
      </div>
      {hasAtLeastOneUrl && (
        <div className="song-playback-inline song-playback-left">
          <AudioPlayer
            songId={song.id}
            urls={{
              streamAudioUrl,
              audioUrl,
              storageUrl,
            }}
          />
        </div>
      )}
      {(!hasAtLeastOneUrl) && (
        <p className="status-message">Piesa ta este aproape gata! Mai așteaptă puțin...</p>
      )}
    </div>
  );
} 