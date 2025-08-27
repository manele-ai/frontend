// Audio debugging utility for profile page issues
export const audioDebugger = {
  // Log audio state for debugging
  logAudioState: (songId, audioUrl, isPlaying, error) => {
    console.group(`🎵 Audio Debug - Song ${songId}`);
    console.log('URL:', audioUrl);
    console.log('Is Playing:', isPlaying);
    console.log('Error:', error);
    console.log('Timestamp:', new Date().toISOString());
    console.groupEnd();
  },

  // Check if audio element is valid
  validateAudioElement: (audioElement) => {
    if (!audioElement) {
      console.warn('❌ Audio element is null or undefined');
      return false;
    }

    if (typeof audioElement.pause !== 'function') {
      console.warn('❌ Audio element does not have pause method');
      return false;
    }

    if (!audioElement.src) {
      console.warn('❌ Audio element has no source');
      return false;
    }

    console.log('✅ Audio element is valid');
    return true;
  },

  // Monitor audio events
  monitorAudioEvents: (audioElement, songId) => {
    if (!audioElement) return;

    const events = ['loadstart', 'loadedmetadata', 'canplay', 'canplaythrough', 'play', 'pause', 'ended', 'error', 'abort', 'stalled'];
    
    events.forEach(event => {
      audioElement.addEventListener(event, (e) => {
        console.log(`🎵 [${songId}] ${event}:`, e);
      });
    });
  },

  // Check for common mobile audio issues
  checkMobileIssues: () => {
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
    
    console.group('📱 Mobile Audio Check');
    console.log('Is Mobile:', isMobile);
    console.log('Is Safari:', isSafari);
    console.log('User Agent:', navigator.userAgent);
    
    if (isMobile) {
      console.log('⚠️ Mobile device detected - audio may have restrictions');
    }
    
    if (isSafari) {
      console.log('⚠️ Safari detected - may have autoplay restrictions');
    }
    
    console.groupEnd();
  },

  // Test audio URL accessibility
  testAudioUrl: async (url) => {
    if (!url) {
      console.warn('❌ No URL provided for testing');
      return false;
    }

    try {
      console.log('🔍 Testing audio URL:', url);
      
      const response = await fetch(url, { method: 'HEAD' });
      
      if (response.ok) {
        console.log('✅ Audio URL is accessible');
        console.log('Content-Type:', response.headers.get('content-type'));
        console.log('Content-Length:', response.headers.get('content-length'));
        return true;
      } else {
        console.warn('❌ Audio URL returned status:', response.status);
        return false;
      }
    } catch (error) {
      console.error('❌ Error testing audio URL:', error);
      return false;
    }
  }
};

// Export for use in components
export default audioDebugger;
