import { doc, onSnapshot } from 'firebase/firestore';
import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import AudioPlayer from '../components/AudioPlayer';
import { db } from '../services/firebase';
import '../styles/ResultPage.css';
import { downloadFile } from '../utils';

export default function ResultPage() {
  const location = useLocation();
  const { songId } = location.state || {};
  
  const navigate = useNavigate();
  const [isPlaying, setIsPlaying] = useState(false);
  const [songData, setSongData] = useState(null);
  const [error, setError] = useState(null);
  const [isDownloading, setIsDownloading] = useState(false);

  // Subscribe to song data updates when component loads
  useEffect(() => {
    if (!songId) {
      setError('No song ID provided');
      return;
    }

    // Set up real-time listener
    const unsubscribe = onSnapshot(
      doc(db, 'songsPublic', songId),
      (doc) => {
        if (!doc.exists()) {
          setError('Song not found');
          return;
        }
        setSongData(doc.data());
      },
      (err) => {
        console.error('Error fetching song:', err);
        setError(err.message || 'Failed to load song');
      }
    );

    // Cleanup subscription on unmount
    return () => unsubscribe();
  }, [songId]);

  const handlePlayPause = () => {
    setIsPlaying(!isPlaying);
  };

  const handleDownload = async () => {
    if (!songData?.storage?.url) {
      console.error('No download URL available');
      return;
    }

    setIsDownloading(true);
    try {
      downloadFile(songData.storage.url, `${songData.apiData.title || 'manea'}.mp3`);
    } catch (error) {
      console.error("Failed to download song:", error);
      setError("Failed to download song. Please try again.");
    } finally {
      setIsDownloading(false);
    }
  };

  // Get the appropriate audio URL based on availability
  const getAudioUrl = () => {
    if (songData?.storage?.url) {
      return songData.storage.url;
    }
    if (songData?.apiData?.audioUrl) {
      return songData.apiData.audioUrl;
    }
    if (songData?.apiData?.streamAudioUrl) {
      return songData.apiData.streamAudioUrl;
    }
    return null;
  };

  // Show error state
  if (error) {
    return (
      <div className="result-page">
        <div className="container">
          <h1 className="title">Error</h1>
          <p className="error-message">{error}</p>
          <button 
            className="back-button"
            onClick={() => navigate('/')}
          >
            ← Înapoi
          </button>
        </div>
      </div>
    );
  }

  // Show loading state
  if (!songData) {
    return (
      <div className="result-page">
        <div className="container">
          <h1 className="title">Se încarcă...</h1>
        </div>
      </div>
    );
  }

  const audioUrl = getAudioUrl();
  const canDownload = songData.storage?.url || songData.apiData?.audioUrl;

  return (
    <div className="result-page">
      <button 
        className="back-button"
        onClick={() => navigate('/')}
      >
        ← Înapoi
      </button>
      
      <div className="container">
        <h1 className="title">{songData.apiData.title || 'Piesa ta e gata!'}</h1>
        <p className="subtitle">
          Stil: <span className="style-highlight">{songData.userGenerationInput.style || 'Nespecificat'}</span>
        </p>
        
        <div className="player-box">
          <img
            src={songData.apiData.imageUrl || 'https://via.placeholder.com/150'}
            alt="Song artwork"
            className="song-artwork"
          />
          
          {audioUrl ? (
            <>
              <AudioPlayer
                audioUrl={audioUrl}
                isPlaying={isPlaying}
                onPlayPause={handlePlayPause}
                onError={setError}
              />
              {canDownload && (
                <button
                  className="download-btn"
                  onClick={handleDownload}
                  disabled={isDownloading}
                >
                  <span>{isDownloading ? 'Se descarcă...' : 'Descarcă'}</span>
                </button>
              )}
            </>
          ) : (
            <p className="status-message">Piesa ta este aproape gata! Mai așteaptă puțin...</p>
          )}
        </div>
      </div>
    </div>
  );
} 