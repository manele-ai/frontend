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
  const navigate = useNavigate();
  const location = useLocation();
  const { taskId } = location.state || {};
  
  const [progress, setProgress] = useState(0);
  const [statusText, setStatusText] = useState('Se pregătește generarea...');

  useEffect(() => {
    if (!taskId) {
      console.error('No taskId found, redirecting to home.');
      navigate('/');
      return;
    }

    // Initial state
    setProgress(10);
    setStatusText('Se inițializează procesul...');

    const intervalId = setInterval(async () => {
      try {
        const result = await pollManeaSongResult(taskId);
        const { status, songData, error } = result;
        
        const newProgress = progressMap[status] || { percent: progress, text: statusText };

        // A small trick to show intermediate progress
        if (status === 'processing' && progress < 40) {
            setProgress(newProgress.percent);
            setStatusText(newProgress.text);
        } else if (status === 'processing' && progress >= 40) {
            setProgress(progressMap.generating.percent);
            setStatusText(progressMap.generating.text);
        } else {
            setProgress(newProgress.percent);
            setStatusText(newProgress.text);
        }

        if (status === 'completed') {
          clearInterval(intervalId);
          setTimeout(() => {
            navigate('/result', { state: { songData } });
          }, 1000); // Wait a bit on 100% before navigating
        }

        if (status === 'failed') {
          console.error('Song generation failed:', error);
          clearInterval(intervalId);
          // Optional: navigate to an error page or show error message
        }
      } catch (err) {
        console.error('Polling failed:', err);
        setStatusText('A apărut o eroare la verificare. Se reîncearcă...');
      }
    }, 5000); // Poll every 5 seconds for faster feedback in development

    // Cleanup on unmount
    return () => clearInterval(intervalId);
  }, [taskId, navigate, progress, statusText]);

  return (
    <div className="loading-page">
      <div className="loading-container">
        <h1 className="loading-title">Se generează maneaua...</h1>
        <div className="progress-bar-container">
          <div 
            className="progress-bar"
            style={{ width: `${progress}%` }}
          />
        </div>
        <p className="loading-percentage">{Math.round(progress)}%</p>
        <p className="loading-status">{statusText}</p>
      </div>
    </div>
  );
} 