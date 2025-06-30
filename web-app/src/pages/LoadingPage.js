import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { pollManeaSongResult } from '../api';
import '../styles/LoadingPage.css';

// Map statuses to progress percentages and text
const progressMap = {
  processing: { percent: 45, text: 'ManeleAI generează versurile și stilul...' },
  generating: { percent: 75, text: 'Inteligența artificială compune linia melodică...' }, // This is an intermediate status we can use on the client
  completed: { percent: 100, text: 'Piesa este gata!' },
  failed: { percent: 100, text: 'Ne pare rău, a apărut o eroare.' },
};

export default function LoadingPage() {
  const location = useLocation();
  const navigate = useNavigate();
  
  // Get taskId from the HomePage
  const { taskId, style, title, lyricsDetails } = location.state || {};
  
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState('Se generează versurile...');
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!taskId) {
      navigate('/');
      return;
    }

    const interval = setInterval(async () => {
      try {
        const result = await pollManeaSongResult(taskId);
        
        if (result.status === 'completed' && result.songData) {
          // Song is ready!
          navigate('/result', { 
            state: { 
              songData: result.songData,
              style,
              title,
              lyricsDetails
            } 
          });
        } else if (result.status === 'failed') {
          setError(result.error || 'Generarea piesei a eșuat. Încearcă din nou.');
        } else {
          // Still processing, update progress
          setProgress(prev => Math.min(prev + Math.random() * 15, 90));
          
          // Update status based on progress
          if (progress < 30) {
            setStatus('Se generează versurile...');
          } else if (progress < 60) {
            setStatus('Se compune muzica...');
          } else {
            setStatus('Se finalizează piesa...');
          }
        }
      } catch (err) {
        console.error('Error polling result:', err);
        setError('A apărut o eroare. Încearcă din nou.');
      }
    }, 2000); // Poll every 2 seconds

    return () => clearInterval(interval);
  }, [taskId, navigate, progress, style, title, lyricsDetails]);

  if (error) {
    return (
      <div className="loading-page">
        <div className="loading-container">
          <h1 className="loading-title">Eroare</h1>
          <p className="loading-status">{error}</p>
          <button 
            className="button"
            onClick={() => navigate('/')}
          >
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
        
        <div className="progress-bar-container">
          <div 
            className="progress-bar"
            style={{ width: `${progress}%` }}
          ></div>
        </div>
        
        <p className="loading-percentage">{Math.round(progress)}%</p>
        <p className="loading-status">{status}</p>
      </div>
    </div>
  );
} 