import { useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { generateManeaSong, pollManeaSongResult } from '../api';
import '../styles/LoadingPage.css';

const GIF = '/NeTf.gif';

export default function LoadingPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const [status, setStatus] = useState('Se pregătește generarea...');
  const [error, setError] = useState(null);
  const [taskId, setTaskId] = useState(null);
  const generationStartedRef = useRef(false);
  const pollingRef = useRef(null);

  // Extrage datele din HomePage
  const {
    style, from, to, dedication, title, lyricsDetails, wantsDedication, wantsDonation, donationAmount, mode
  } = location.state || {};

  // Trimite requestul la mount
  useEffect(() => {
    // Validate required fields and redirect if missing
    if (!style || !title) {
      navigate('/');
      return;
    }

    // Only start generation if we haven't already
    if (generationStartedRef.current) {
      return;
    }

    const startGeneration = async () => {
      try {
        setStatus('Se trimit datele către AI...');
        setError(null);
        generationStartedRef.current = true;
        
        const result = await generateManeaSong({
          style, from, to, dedication, title, lyricsDetails, wantsDedication, wantsDonation, donationAmount, mode
        });
        
        setTaskId(result.taskId);
        setStatus('AI-ul compune maneaua...');
      } catch (err) {
        setError(err.message || 'Eroare la generare. Încearcă din nou.');
        setStatus('');
        generationStartedRef.current = false;
      }
    };

    startGeneration();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [navigate]); // Only depend on navigate since other values are from location.state

  // Polling dupa taskId
  useEffect(() => {
    if (!taskId) return;
    
    setStatus('AI-ul compune maneaua...');
    setError(null);
    
    pollingRef.current = setInterval(async () => {
      try {
        const result = await pollManeaSongResult(taskId);
        if (result.status === 'completed' && result.songData) {
          clearInterval(pollingRef.current);
          navigate('/result', {
            state: {
              songData: result.songData,
              style,
              title,
              lyricsDetails
            }
          });
        } else if (result.status === 'failed') {
          clearInterval(pollingRef.current);
          setError(result.error || 'Generarea piesei a eșuat. Încearcă din nou.');
          setStatus('');
        } else {
          setStatus('AI-ul compune maneaua...');
        }
      } catch (err) {
        clearInterval(pollingRef.current);
        setError('A apărut o eroare. Încearcă din nou.');
        setStatus('');
      }
    }, 2000);
    
    return () => clearInterval(pollingRef.current);
  }, [taskId, navigate, style, title, lyricsDetails]);

  const handleRetry = () => {
    setError(null);
    generationStartedRef.current = false;
    setTaskId(null);
    setStatus('Se pregătește generarea...');
  };

  if (error) {
    return (
      <div className="loading-page">
        <div className="loading-container">
          <h1 className="loading-title">Eroare</h1>
          <p className="loading-status">{error}</p>
          <button className="button" onClick={handleRetry}>
            Încearcă din nou
          </button>
          <button className="button" onClick={() => navigate('/')}
            style={{ marginTop: 12 }}>
            Înapoi la început
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="loading-page">
      <div className="loading-container">
        <h1 className="loading-title">Se generează maneaua...</h1>
        <p style={{ fontSize: 13, color: '#a2a5bd', marginTop: -18, marginBottom: 18 }}>
          Generarea durează între 2 - 5 minute. Te rugăm să ai răbdare!
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', margin: '32px 0' }}>
          <div className="spinner" style={{ width: 60, height: 60, borderWidth: 6, marginBottom: 24 }}></div>
          <img
            src={GIF}
            alt="gif loading manea"
            style={{ width: 180, height: 120, borderRadius: 12, objectFit: 'cover', boxShadow: '0 4px 16px #0008', marginBottom: 12 }}
          />
        </div>
        <p className="loading-status">{status}</p>
      </div>
    </div>
  );
} 