import { useEffect, useRef, useState } from 'react';

function useAudio(url) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [error, setError] = useState(null);
  const [showWave, setShowWave] = useState(false);
  const audioRef = useRef(new Audio());

  useEffect(() => {
    const audio = audioRef.current;

    const handlePlay = () => {
      setIsPlaying(true);
      setShowWave(true);
      setError(null);
    };

    const handlePause = () => {
      setIsPlaying(false);
      setShowWave(false);
    };

    const handleEnded = () => {
      setIsPlaying(false);
      setShowWave(false);
    };

    const handleError = (e) => {
      setError('Nu s-a putut reda piesa.');
      setIsPlaying(false);
      setShowWave(false);
    };

    audio.addEventListener('play', handlePlay);
    audio.addEventListener('pause', handlePause);
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('error', handleError);

    return () => {
      audio.removeEventListener('play', handlePlay);
      audio.removeEventListener('pause', handlePause);
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('error', handleError);
    };
  }, []);

  const play = async () => {
    if (!url) {
      setError('Nu există url audio!');
      return;
    }

    try {
      const audio = audioRef.current;
      audio.src = url;
      await audio.play();
    } catch (err) {
      setError('Nu s-a putut reda piesa.');
      setShowWave(false);
    }
  };

  const pause = () => {
    const audio = audioRef.current;
    audio.pause();
  };

  const toggle = () => {
    if (isPlaying) {
      pause();
    } else {
      play();
    }
  };

  const stop = () => {
    const audio = audioRef.current;
    audio.pause();
    audio.currentTime = 0;
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      const audio = audioRef.current;
      audio.pause();
      audio.src = '';
    };
  }, []);

  return {
    isPlaying,
    error,
    showWave,
    play,
    pause,
    toggle,
    stop,
    audio: audioRef.current
  };
}

export default useAudio; 