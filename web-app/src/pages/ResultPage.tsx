// src/pages/ResultPage.tsx
import { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import SongResultCard from '../components/SongResultCard';
import SongResultCardSkeleton from '../components/SongResultCardSkeleton';
import Button from '../components/ui/Button';
import '../styles/ResultPage.css';

import ExampleSongsList from 'components/ExampleSongsList';
import { useGenerationStatus } from '../hooks/useGenerationStatus';

const GIF = '/NeTf.gif';

type LocationState = { requestId?: string };

function useRequestIdFromLocation() {
  const location = useLocation();
  const requestIdFromState = (location.state as LocationState | undefined)?.requestId ?? null;
  const requestIdFromQuery = new URLSearchParams(location.search).get('request_id');
  return requestIdFromState || requestIdFromQuery || null;
}

export default function ResultPage() {
  const navigate = useNavigate();
  const incomingRequestId = useRequestIdFromLocation();

  const {
    viewData,
    isLoadingData,
    generationStatus,
    isGenerationProcessing,
    isGenerationPartial,
    isGenerationComplete,
    isGenerationFailed,
    hasTimedOut,
    activeId,
    setActiveGenerationId,
  } = useGenerationStatus();

  // Ensure the active request id follows navigation param/state
  useEffect(() => {
    if (incomingRequestId) {
      setActiveGenerationId(incomingRequestId);
    }
    // console.log('isGenerationProcessing', isGenerationProcessing);
    // if (!isGenerationProcessing) {
    //   navigate('/generate');
    //   return;
    // }
  }, [incomingRequestId, activeId, setActiveGenerationId]);

  // Derive songIds from the generation view (supports single or multiple)
  const songIds: string[] = useMemo(() => {
    if (!viewData) return [];
    if (Array.isArray(viewData.songIds) && viewData.songIds.length > 0) return viewData.songIds as string[];
    return [];
  }, [viewData]);

  // Loading progress (purely visual)
  const [loadingProgress, setLoadingProgress] = useState<number>(() => {
    const saved = localStorage.getItem('resultPageLoadingProgress');
    return saved ? parseFloat(saved) : 0;
  });

  // Update progress while we wait; stop on complete/fail
  useEffect(() => {
    if (!viewData?.generationStarted) {
      localStorage.removeItem('resultPageLoadingProgress');
      setLoadingProgress(0);
      return;
    }
    if (songIds.length > 0) {
      // we have at least one song doc coming in; let progress finish naturally or keep UI
      return;
    }

    const duration = 120000; // 2 minutes
    const interval = 100;
    const inc = (interval / duration) * 100;
    const timer = window.setInterval(() => {
      setLoadingProgress((prev) => {
        const next = Math.min(prev + inc, 100);
        localStorage.setItem('resultPageLoadingProgress', String(next));
        return next;
      });
    }, interval);

    return () => window.clearInterval(timer);
  }, [viewData?.generationStarted, songIds.length]);

  const statusMsg = useMemo(() => {
    switch (generationStatus) {
      case 'processing':
        return 'AI-ul compune maneaua ta';
      case 'partial':
        return 'Poți asculta maneaua ta';
      case 'completed':
        return 'Maneaua a fost generată!';
      case 'failed':
        return 'Generarea a eșuat.';
      default:
        return 'Se generează maneaua ta';
    }
  }, [generationStatus]);

  // Error (timeout or failed)
  const errorMessage = useMemo(() => {
    if (hasTimedOut) {
      return 'Generarea a durat prea mult. Te rugăm să încerci din nou.';
    }
    if (isGenerationFailed) {
      return viewData?.error || 'Generarea a eșuat.';
    }
    return null;
  }, [hasTimedOut, isGenerationFailed, viewData?.error]);

  if (errorMessage) {
    return (
      <div
        className="result-page"
        style={{
          backgroundImage: 'url(/backgrounds/patternFudalSecond.svg)',
          backgroundSize: '30%',
          backgroundPosition: '0 0',
          backgroundRepeat: 'repeat',
        }}
      >
        <div className="container">
          <h1 className="title">Oops! A apărut o problemă</h1>
          <div className="error-content">
            <p className="error-message">{errorMessage}</p>
            <div className="error-reassurance">
              <p className="reassurance-text">
                <strong>Nu te îngrijora!</strong> Nu ți-ai pierdut creditele.
                Poți încerca din nou să generezi maneaua fără să plătești nimic.
              </p>
            </div>
            <div className="error-actions">
              <button className="hero-btn" onClick={() => navigate('/generate')} style={{ marginBottom: 10 }}>
                <span className="hero-btn-text">Încearcă din nou</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  } else if (isGenerationPartial || isGenerationComplete) {
    // Render all songs (partial or completed) or skeletons if data is loading
    return (
      <div
        className="result-page"
        style={{
          backgroundImage: 'url(/backgrounds/patternFudalSecond.svg)',
          backgroundSize: '30%',
          backgroundPosition: '0 0',
          backgroundRepeat: 'repeat',
        }}
      >
        <div className="result-container">
          <div className="songs-container">
            {isLoadingData ? (
              // Show skeleton placeholders while data is loading
              <SongResultCardSkeleton key={`skeleton-0`} index={0} />
            ) : (
              // Show actual songs when data is loaded
              songIds.map((id, index) => (
                viewData.songById?.[id] && (
                  <SongResultCard
                    key={id}
                    index={index}
                    song={viewData.songById?.[id]}
                    lyrics={viewData.lyrics ?? null}
                    userGenerationInput={viewData.userGenerationInput}
                  />
                )
              ))
            )}
          </div>
          <Button className="hero-btn" style={{ marginTop: 20 }} onClick={() => navigate('/generate')}>
            <span className="hero-btn-text gen-btn">Generează manea nouă</span>
          </Button>
        </div>
      </div>
    );
  } else {
    // Loading is the default
    return (
      <div
        className="result-page"
        style={{
          backgroundImage: 'url(/backgrounds/patternFudalSecond.svg)',
          backgroundSize: '30%',
          backgroundPosition: '0 0',
          backgroundRepeat: 'repeat',
        }}
      >
        <div className="loading-container">
          <div className="loading-gif-container">
            <img src={GIF} alt="gif loading manea" className="loading-gif" />
            <div className="loading-gif-overlay">
              <div className="loading-bar-container">
                <div className="loading-bar" style={{ width: `${loadingProgress}%` }} />
              </div>

              <h1 className="title">Se generează maneaua...</h1>
              <p className="subtitle">Generarea durează între 2 - 5 minute. Te rugăm să ai răbdare!</p>
              <p className="status-message">{statusMsg}</p>
            </div>
          </div>
          <ExampleSongsList />
        </div>
      </div>
    );
  }
}
