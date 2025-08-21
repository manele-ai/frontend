import { useCallback, useEffect, useRef, useState } from 'react';

// Global audio state manager
class GlobalAudioStateManager {
  constructor() {
    this.currentPlayingSongId = null;
    this.listeners = new Set();
    this.audioElements = new Map();
  }

  setPlayingSong(songId) {
    const previousSongId = this.currentPlayingSongId;
    this.currentPlayingSongId = songId;
    
    // Notify all listeners
    this.listeners.forEach(listener => {
      listener(songId, previousSongId);
    });
  }

  getPlayingSong() {
    return this.currentPlayingSongId;
  }

  addListener(listener) {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  registerAudioElement(songId, audioElement) {
    this.audioElements.set(songId, audioElement);
  }

  unregisterAudioElement(songId) {
    this.audioElements.delete(songId);
  }

  pauseAllExcept(songId) {
    this.audioElements.forEach((audioElement, id) => {
      if (id !== songId && audioElement && !audioElement.paused) {
        audioElement.pause();
      }
    });
  }

  cleanup() {
    this.audioElements.forEach((audioElement) => {
      if (audioElement) {
        audioElement.pause();
        audioElement.src = '';
      }
    });
    this.audioElements.clear();
    this.currentPlayingSongId = null;
  }
}

// Singleton instance
const globalAudioStateManager = new GlobalAudioStateManager();

export const useAudioState = () => {
  const [playingSongId, setPlayingSongId] = useState(globalAudioStateManager.getPlayingSong());
  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;
    
    const unsubscribe = globalAudioStateManager.addListener((newSongId, previousSongId) => {
      if (isMountedRef.current) {
        setPlayingSongId(newSongId);
      }
    });

    return () => {
      isMountedRef.current = false;
      unsubscribe();
    };
  }, []);

  const playSong = useCallback((songId) => {
    globalAudioStateManager.setPlayingSong(songId);
  }, []);

  const stopSong = useCallback(() => {
    globalAudioStateManager.setPlayingSong(null);
  }, []);

  const registerAudioElement = useCallback((songId, audioElement) => {
    globalAudioStateManager.registerAudioElement(songId, audioElement);
  }, []);

  const unregisterAudioElement = useCallback((songId) => {
    globalAudioStateManager.unregisterAudioElement(songId);
  }, []);

  const pauseAllExcept = useCallback((songId) => {
    globalAudioStateManager.pauseAllExcept(songId);
  }, []);

  return {
    playingSongId,
    playSong,
    stopSong,
    registerAudioElement,
    unregisterAudioElement,
    pauseAllExcept,
  };
};

// Export the global manager for direct access if needed
export { globalAudioStateManager };
