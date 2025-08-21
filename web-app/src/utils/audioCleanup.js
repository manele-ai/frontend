import { globalAudioStateManager } from '../hooks/useAudioState';

// Cleanup function to be called when the app unmounts
export const cleanupAudioOnAppUnmount = () => {
  // Cleanup global audio state manager
  globalAudioStateManager.cleanup();
  
  // Additional cleanup for any remaining audio elements
  const audioElements = document.querySelectorAll('audio');
  audioElements.forEach(audio => {
    audio.pause();
    audio.src = '';
    audio.load();
  });
  
  // Clear any audio contexts
  if (window.AudioContext || window.webkitAudioContext) {
    // Note: We can't easily track all audio contexts, but this helps with cleanup
    console.log('Audio cleanup completed');
  }
};

// Function to pause all audio when app goes to background (mobile)
export const pauseAllAudioOnBackground = () => {
  globalAudioStateManager.pauseAllExcept(null);
};

// Function to resume audio when app comes to foreground (mobile)
export const resumeAudioOnForeground = () => {
  // This would be called when the app comes back to foreground
  // Implementation depends on your app's lifecycle management
};

// Setup visibility change listener for mobile background/foreground handling
export const setupAudioVisibilityHandling = () => {
  const handleVisibilityChange = () => {
    if (document.hidden) {
      // App went to background
      pauseAllAudioOnBackground();
    } else {
      // App came to foreground
      // Note: We don't auto-resume audio as it might violate mobile autoplay policies
    }
  };

  document.addEventListener('visibilitychange', handleVisibilityChange);
  
  // Return cleanup function
  return () => {
    document.removeEventListener('visibilitychange', handleVisibilityChange);
  };
};
