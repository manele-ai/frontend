import { createContext, useContext, useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';

const GenerationContext = createContext();

export const useGeneration = () => {
  const context = useContext(GenerationContext);
  if (!context) {
    throw new Error('useGeneration must be used within a GenerationProvider');
  }
  return context;
};

export const GenerationProvider = ({ children }) => {
  const [isGenerating, setIsGenerating] = useState(() => {
    // Initialize from localStorage
    const saved = localStorage.getItem('generationState');
    if (saved) {
      const parsed = JSON.parse(saved);
      return parsed.isGenerating || false;
    }
    return false;
  });
  
  const [generationRequestId, setGenerationRequestId] = useState(() => {
    const saved = localStorage.getItem('generationState');
    if (saved) {
      const parsed = JSON.parse(saved);
      return parsed.generationRequestId || null;
    }
    return null;
  });
  
  const [generationSongId, setGenerationSongId] = useState(() => {
    const saved = localStorage.getItem('generationState');
    if (saved) {
      const parsed = JSON.parse(saved);
      return parsed.generationSongId || null;
    }
    return null;
  });
  
  const location = useLocation();

  // Save state to localStorage whenever it changes
  useEffect(() => {
    const state = {
      isGenerating,
      generationRequestId,
      generationSongId
    };
    
    // Only save to localStorage if there's an active generation
    if (isGenerating && generationRequestId) {
      localStorage.setItem('generationState', JSON.stringify(state));
    } else {
      // Clear localStorage if there's no active generation
      localStorage.removeItem('generationState');
    }
  }, [isGenerating, generationRequestId, generationSongId]);

  // Check if we're on the result page and if there's an active generation
  useEffect(() => {
    if (location.pathname === '/result') {
      const { requestId, songId } = location.state || {};
      if (requestId) {
        setIsGenerating(true);
        setGenerationRequestId(requestId);
        setGenerationSongId(songId);
      }
    }
  }, [location]);

  // Clear generation state when song is completed
  const clearGeneration = () => {
    setIsGenerating(false);
    setGenerationRequestId(null);
    setGenerationSongId(null);
  };

  // Set generation state when starting a new generation
  const startGeneration = (requestId, songId = null) => {
    // Don't set if already generating with the same requestId
    if (isGenerating && generationRequestId === requestId) {
      return;
    }
    
    setIsGenerating(true);
    setGenerationRequestId(requestId);
    setGenerationSongId(songId);
  };

  // Update song ID when song is complete
  const updateSongId = (songId) => {
    setGenerationSongId(songId);
  };

  const value = {
    isGenerating,
    generationRequestId,
    generationSongId,
    startGeneration,
    clearGeneration,
    updateSongId
  };

  return (
    <GenerationContext.Provider value={value}>
      {children}
    </GenerationContext.Provider>
  );
}; 