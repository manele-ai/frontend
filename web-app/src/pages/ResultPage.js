import { doc, onSnapshot } from 'firebase/firestore';
import { useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import AudioPlayer from '../components/AudioPlayer';
import { db } from '../services/firebase';
import '../styles/ResultPage.css';
import { downloadFile } from '../utils';

export default function ResultPage() {
  const location = useLocation();
  const navigate = useNavigate();

  // Extract params passed via navigation state or URL query (e.g. ?request_id=abc)
  const { songId: songIdState, requestId: requestIdState } = location.state || {};
  const queryParams = new URLSearchParams(location.search);
  const requestIdParam = queryParams.get('request_id');

  const [requestId] = useState(requestIdState || requestIdParam || null);
  const [taskId, setTaskId] = useState(null);
  const [songId, setSongId] = useState(songIdState || null);

  const genReqUnsubRef = useRef(null);
  const taskStatusUnsubRef = useRef(null);
  const songUnsubRef = useRef(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [songData, setSongData] = useState(null);
  const [statusMsg, setStatusMsg] = useState('Se verifică statusul generării...');
  const [error, setError] = useState(null);
  const [isDownloading, setIsDownloading] = useState(false);

  // ---- Listen to Generation Request if we only have requestId ----
  useEffect(() => {
    if (!requestId) return;

    genReqUnsubRef.current = onSnapshot(
      doc(db, 'generationRequests', requestId),
      (snap) => {
        if (!snap.exists()) {
          setError('Cererea de generare nu a fost găsită.');
          return;
        }
        const data = snap.data();

        if (data.paymentStatus === 'failed') {
          setError('Plata a eșuat. Reîncearcă.');
          return;
        }

        if (data.taskId && !taskId) {
          setTaskId(data.taskId);
          setStatusMsg('Generarea piesei este în curs...');
        }
      },
      (err) => {
        console.error(err);
        setError('Eroare la citirea cererii de generare.');
      }
    );

    return () => {
      if (genReqUnsubRef.current) genReqUnsubRef.current();
    };
  }, [requestId, taskId]);

  // ---- Listen to taskStatus when taskId is available ----
  useEffect(() => {
    if (!taskId) return;

    taskStatusUnsubRef.current = onSnapshot(
      doc(db, 'taskStatuses', taskId),
      (snap) => {
        if (!snap.exists()) return;
        const data = snap.data();

        switch (data.status) {
          case 'processing':
            setStatusMsg('AI-ul compune piesa...');
            break;
          case 'partial':
            setStatusMsg('Piesa este aproape gata...');
            break;
          case 'completed':
            if (data.songId) {
              setSongId(data.songId);
            }
            break;
          case 'failed':
            setError(data.error || 'Generarea a eșuat.');
            break;
          default:
            break;
        }
      },
      (err) => {
        console.error(err);
        setError('Eroare la citirea statusului taskului.');
      }
    );

    return () => {
      if (taskStatusUnsubRef.current) taskStatusUnsubRef.current();
    };
  }, [taskId]);

  // ---- Listen to song document when songId available ----
  useEffect(() => {
    if (!songId) return;

    const unsub = onSnapshot(
      doc(db, 'songsPublic', songId),
      (docSnap) => {
        if (docSnap.exists()) {
          setSongData(docSnap.data());
        }
      },
      (err) => {
        console.error(err);
        setError('Eroare la încărcarea piesei.');
      }
    );

    return () => unsub();
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

  // Show loading state while waiting for song or status
  if (!songData) {
    return (
      <div className="result-page">
        <div className="container">
          <h1 className="title">Se încarcă...</h1>
          <div className="player-box">
            <div className="loading-container">
              <div className="spinner" />
              <p className="status-message">{statusMsg}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const audioUrl = getAudioUrl();
  const canDownload = songData.storage?.url || songData.apiData?.audioUrl;

  return (
    <div className="result-page">
      {/* Butonul de Înapoi eliminat */}
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