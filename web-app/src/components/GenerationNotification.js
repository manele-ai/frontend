import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGeneration } from '../context/GenerationContext';
import '../styles/GenerationNotification.css';

export default function GenerationNotification() {
  const navigate = useNavigate();
  const { isGenerating, generationRequestId, generationSongId, clearGeneration } = useGeneration();
  const [isVisible, setIsVisible] = useState(false);
  const [isComplete, setIsComplete] = useState(false);

  // Show notification when generation starts
  useEffect(() => {
    if (isGenerating && generationRequestId) {
      setIsVisible(true);
      setIsComplete(false);
    } else if (!isGenerating && !generationRequestId && isVisible) {
      // No active generation, hide notification
      setIsVisible(false);
      setIsComplete(false);
    }
  }, [isGenerating, generationRequestId, isVisible]);

  // Handle completion state
  useEffect(() => {
    if (isVisible && !isGenerating && generationSongId) {
      // Song is complete - show immediately
      setIsComplete(true);
    } else if (isVisible && !isGenerating && !generationSongId) {
      // Generation was cancelled or failed
      const timer = setTimeout(() => {
        setIsVisible(false);
        setIsComplete(false);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [isGenerating, generationSongId, isVisible]);

  // Auto-clear when song is complete
  useEffect(() => {
    if (isComplete && generationSongId) {
      const timer = setTimeout(() => {
        setIsVisible(false);
        setIsComplete(false);
        clearGeneration();
      }, 8000); // 8 seconds delay
      return () => clearTimeout(timer);
    }
  }, [isComplete, generationSongId, clearGeneration]);

  const handleClick = () => {
    if (isComplete) {
      // Navigate to result page when complete
      if (generationRequestId) {
        navigate('/result', { 
          state: { 
            requestId: generationRequestId, 
            songId: generationSongId 
          } 
        });
      }
      // Hide notification after click
      setIsVisible(false);
      setIsComplete(false);
      clearGeneration();
    } else {
      // Navigate to result page when loading
      if (generationRequestId) {
        navigate('/result', { 
          state: { 
            requestId: generationRequestId, 
            songId: generationSongId 
          } 
        });
      }
    }
  };

  if (!isVisible) return null;

  return (
    <div 
      className={`generation-notification ${isComplete ? 'complete' : ''}`}
      onClick={handleClick}
    >
      <div className="notification-content">
        <div className="notification-icon">
          {isComplete ? (
            <span className="check-icon">✓</span>
          ) : (
            <span className="spinner">$</span>
          )}
        </div>
        <div className="notification-text">
          <div className="notification-title">
            {isComplete ? 'Maneaua e gata!' : 'Se generează maneaua...'}
          </div>
          <div className="notification-subtitle">
            {isComplete ? 'Click pentru a asculta' : 'Click pentru a vedea progresul'}
          </div>
        </div>
      </div>
    </div>
  );
} 