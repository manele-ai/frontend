import { doc, onSnapshot } from 'firebase/firestore';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useNotification } from '../context/NotificationContext';
import { db } from '../services/firebase';

// Funcție utilitară pentru ștergerea datelor formularului
const clearFormData = () => {
  // Chei pentru Easy Mode
  const EASY_FORM_KEYS = [
    'easyForm_selectedStyle',
    'easyForm_songName',
    'easyForm_isActive'
  ];
  
  // Chei pentru Complex Mode
  const COMPLEX_FORM_KEYS = [
    'complexForm_selectedStyle',
    'complexForm_songName',
    'complexForm_songDetails',
    'complexForm_wantsDedication',
    'complexForm_fromName',
    'complexForm_toName',
    'complexForm_dedication',
    'complexForm_wantsDonation',
    'complexForm_donorName',
    'complexForm_donationAmount',
    'complexForm_isActive'
  ];
  
  // Șterge toate cheile pentru ambele moduri
  [...EASY_FORM_KEYS, ...COMPLEX_FORM_KEYS].forEach(key => {
    localStorage.removeItem(key);
  });
};

  // Timeout duration: 6 minutes
  const TIMEOUT_DURATION = 6 * 60 * 1000;

export const useGlobalSongStatus = () => {
  const { showNotification, clearAll } = useNotification();
  const navigate = useNavigate();
  const activeListeners = useRef(new Map());
  // Add timeout tracking
  const timeoutRef = useRef(null);

  // Reactive state to expose to consumers
  const [activeRequestId, setActiveRequestId] = useState(null);
  const [activeTaskId, setActiveTaskId] = useState(null);
  const [activeSongId, setActiveSongId] = useState(null);
  const [latestTaskData, setLatestTaskData] = useState(null);
  const [latestGenerationData, setLatestGenerationData] = useState(null);
  // Add timeout state
  const [hasTimedOut, setHasTimedOut] = useState(false);
  const [timeoutStartTime, setTimeoutStartTime] = useState(null);

  // Function to clear timeout and reset timeout state
  const clearGenerationTimeout = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    setTimeoutStartTime(null);
    
    // Clear timeout-related localStorage items
    localStorage.removeItem('generationTimeoutStart');
    localStorage.removeItem('generationTimeoutRequestId');
    localStorage.removeItem('generationTimeoutTaskId');
  }, []);

  // Function to reset timeout state (useful when starting a new generation)
  const resetTimeoutState = useCallback(() => {
    clearGenerationTimeout();
    setHasTimedOut(false);
  }, [clearGenerationTimeout]);

  // Helper function to determine if there's an active generation
  const isGenerationActive = () => {
    // If we've timed out, no active generation
    if (hasTimedOut) {
      return false;
    }
    
    // Check if there's an active request ID (from localStorage or state)
    const savedRequestId = localStorage.getItem('activeGenerationRequestId');
    const hasActiveRequest = savedRequestId || activeRequestId;
    
    if (!hasActiveRequest) {
      return false;
    }
    
    // If we have task data, check if it's in a pending/processing state
    if (latestTaskData) {
      const status = latestTaskData.status;
      // Consider 'processing' as active/pending, but not 'partial', 'completed', or 'failed'
      return status === 'processing';
    }
    
    // If we have generation data, check statuses
    if (latestGenerationData) {
      // If payment failed or request was marked as refunded/error, don't consider it active
      if (
        latestGenerationData.paymentStatus === 'failed' ||
        latestGenerationData.refundedAsCredit === true ||
        !!latestGenerationData.error
      ) {
        return false;
      }
      // If we have a taskId but no task data yet, consider it active
      if (latestGenerationData.taskId) {
        return true;
      }
    }
    
    // If we have an active request but no task data yet, consider it active
    return true;
  };

  const cleanupListeners = useCallback((requestId, taskId, songId) => {
    if (requestId && activeListeners.current.has(requestId)) {
      activeListeners.current.get(requestId)();
      activeListeners.current.delete(requestId);
    }
    if (taskId && activeListeners.current.has(taskId)) {
      activeListeners.current.get(taskId)();
      activeListeners.current.delete(taskId);
    }
    if (songId && activeListeners.current.has(songId)) {
      activeListeners.current.get(songId)();
      activeListeners.current.delete(songId);
    }
  }, []);

  // Function to start timeout when generation enters processing
  const startGenerationTimeout = useCallback((requestId, taskId) => {
    // Clear any existing timeout first
    clearGenerationTimeout();
    
    const startTime = Date.now();
    setTimeoutStartTime(startTime);
    setHasTimedOut(false);
    
    // Save start time to localStorage for persistence across page refreshes
    localStorage.setItem('generationTimeoutStart', startTime.toString());
    localStorage.setItem('generationTimeoutRequestId', requestId);
    localStorage.setItem('generationTimeoutTaskId', taskId || '');
    
    timeoutRef.current = setTimeout(() => {
      console.log('Generation timeout reached for:', { requestId, taskId });
      
      // Set timeout state
      setHasTimedOut(true);
      
      // Clear notifications and show timeout error
      clearAll();
      
      // Clear the saved requestId when timeout occurs
      localStorage.removeItem('activeGenerationRequestId');
      
      // Clear timeout-related localStorage items
      localStorage.removeItem('generationTimeoutStart');
      localStorage.removeItem('generationTimeoutRequestId');
      localStorage.removeItem('generationTimeoutTaskId');
      
      // Show timeout notification
      showNotification({
        type: 'error',
        title: 'Generarea a durat prea mult',
        message: 'Generarea a depășit timpul maxim permis. Te rugăm să încerci din nou.',
        duration: 30000
      });
      
      // Clean up listeners
      cleanupListeners(requestId, taskId);
      
      // Reset states
      setActiveRequestId(null);
      setActiveTaskId(null);
      setActiveSongId(null);
      setLatestTaskData(null);
      setLatestGenerationData(null);
    }, TIMEOUT_DURATION);
  }, [clearGenerationTimeout, clearAll, showNotification, cleanupListeners]);

  const setupSongListener = useCallback((songId, requestId, taskId) => {
    const unsubscribe = onSnapshot(
      doc(db, 'songsPublic', songId),
      (docSnap) => {
        if (!docSnap.exists()) {
          return;
        }
        
        const songData = docSnap.data();
        
        // Expose active songId when we first attach
        setActiveSongId(songId);

        // Check if song is complete (has title OR streamAudioUrl)
        const hasTitle = songData?.apiData?.title;
        const hasStreamAudioUrl = songData?.apiData?.streamAudioUrl;
        const isComplete = songData && songData.apiData && (hasTitle || hasStreamAudioUrl);
        
        if (isComplete) {
          clearAll();
          // Clear the saved requestId when song is complete
          localStorage.removeItem('activeGenerationRequestId');
          
          // Clear timeout when song is complete
          clearGenerationTimeout();
          
          // Șterge datele formularului când piesa este generată cu succes
          clearFormData();
          
          showNotification({
            type: 'success',
            title: 'Maneaua e gata!',
            message: 'Click pentru a asculta rezultatul.',
            action: {
              label: 'Ascultă',
              onClick: () => {
                navigate('/result', { state: { requestId, songId } });
              }
            },
            duration: 30000
          });
          
          // Clean up listeners
          cleanupListeners(requestId, taskId, songId);
        }
      },
      (err) => {
        console.error('Eroare la song listener:', err);
      }
    );

    activeListeners.current.set(songId, unsubscribe);
  }, [clearAll, showNotification, navigate, cleanupListeners, clearFormData, clearGenerationTimeout]);

  const setupTaskListener = useCallback((taskId, requestId) => {
    const unsubscribe = onSnapshot(
      doc(db, 'taskStatuses', taskId),
      (snap) => {
        if (!snap.exists()) {
          return;
        }
        
        const data = snap.data();

        // Expose latest task data and active ids
        setActiveTaskId(taskId);
        setLatestTaskData(data);
        
        switch (data.status) {
          case 'completed': {
            // Clear timeout when task completes
            clearGenerationTimeout();
            
            const resolvedSongId = data.songId || (Array.isArray(data.songIds) && data.songIds.length > 0 ? data.songIds[0] : null);
            if (resolvedSongId) {
              // Set up song listener
              setupSongListener(resolvedSongId, requestId, taskId);
            }
            break;
          }
          case 'partial':
            // Clear timeout when task reaches partial status
            clearGenerationTimeout();
            
            // Clear form data when status is partial (user requirement)
            clearFormData();
            
            const resolvedSongId = data.songId || (Array.isArray(data.songIds) && data.songIds.length > 0 ? data.songIds[0] : null);
            if (resolvedSongId) {
              // Set up song listener even for partial status if we have songId
              setupSongListener(resolvedSongId, requestId, taskId);
            }
            break;
          case 'failed':
            // Clear timeout when task fails
            clearGenerationTimeout();
            
            // Clear loading notifications and show error
            clearAll();
            // Clear the saved requestId when task fails
            localStorage.removeItem('activeGenerationRequestId');
            
            // NU șterge datele formularului când generarea eșuează
            // clearFormData();
            
            showNotification({
              type: 'error',
              title: 'Eroare la generare',
              message: data.error || 'Generarea a eșuat. Te rugăm să încerci din nou.',
              duration: 30000
            });
            // Clean up listeners
            cleanupListeners(requestId, taskId);
            break;
          case 'processing':
            // Start timeout when task enters processing status
            startGenerationTimeout(requestId, taskId);
            
            if (data.songId) {
              // Set up song listener even for processing status if we have songId
              setupSongListener(data.songId, requestId, taskId);
            }
            break;
          default:
            break;
        }
      },
      (err) => {
        console.error('Eroare la taskStatus listener:', err);
      }
    );

    activeListeners.current.set(taskId, unsubscribe);
  }, [clearAll, showNotification, setupSongListener, cleanupListeners, clearGenerationTimeout, startGenerationTimeout]);

  const setupGenerationListener = useCallback((requestId) => {
    if (activeListeners.current.has(requestId)) {
      return; // Already listening
    }

    // Reset timeout state when setting up a new generation listener
    resetTimeoutState();

    const unsubscribe = onSnapshot(
      doc(db, 'generationRequests', requestId),
      (snap) => {
        if (!snap.exists()) {
          return;
        }
        
        const data = snap.data();
        setLatestGenerationData(data);

        // Expose active request id
        setActiveRequestId(requestId);
        
        // Handle payment failure early
        if (data.paymentStatus === 'failed') {
          clearAll();
          localStorage.removeItem('activeGenerationRequestId');
          showNotification({
            type: 'error',
            title: 'Plata a eșuat',
            message: 'Reîncearcă plata pentru a continua generarea.',
            duration: 30000
          });
          cleanupListeners(requestId);
          return;
        }

        // Handle early generation failure (before task creation)
        if (data.refundedAsCredit === true || data.error) {
          clearAll();
          localStorage.removeItem('activeGenerationRequestId');
          showNotification({
            type: 'error',
            title: 'Eroare la generare',
            message: data.error || 'Generarea a eșuat. Te rugăm să încerci din nou.',
            duration: 30000
          });
          cleanupListeners(requestId);
          return;
        }

        if (data.taskId && !activeListeners.current.has(data.taskId)) {
          // Set up task status listener
          setupTaskListener(data.taskId, requestId);
        }
      },
      (err) => {
        console.error('Eroare la generationRequest listener:', err);
      }
    );

    activeListeners.current.set(requestId, unsubscribe);
  }, [setupTaskListener, resetTimeoutState, clearAll, showNotification, cleanupListeners]);

  // Function to check and restore timeout on page refresh
  const checkAndRestoreTimeout = useCallback(() => {
    const savedStartTime = localStorage.getItem('generationTimeoutStart');
    const savedRequestId = localStorage.getItem('generationTimeoutRequestId');
    const savedTaskId = localStorage.getItem('generationTimeoutTaskId');
    
    if (savedStartTime && savedRequestId) {
      const startTime = parseInt(savedStartTime);
      const elapsedTime = Date.now() - startTime;
      const remainingTime = TIMEOUT_DURATION - elapsedTime;
      
      console.log('Restoring timeout:', { 
        startTime, 
        elapsedTime, 
        remainingTime, 
        requestId: savedRequestId,
        taskId: savedTaskId 
      });
      
      // If timeout has already expired
      if (remainingTime <= 0) {
        console.log('Timeout already expired, clearing state');
        setHasTimedOut(true);
        clearAll();
        localStorage.removeItem('activeGenerationRequestId');
        localStorage.removeItem('generationTimeoutStart');
        localStorage.removeItem('generationTimeoutRequestId');
        localStorage.removeItem('generationTimeoutTaskId');
        
        showNotification({
          type: 'error',
          title: 'Generarea a durat prea mult',
          message: 'Generarea a depășit timpul maxim permis. Te rugăm să încerci din nou.',
          duration: 30000
        });
        return;
      }
      
      // Restore timeout state
      setTimeoutStartTime(startTime);
      setHasTimedOut(false);
      
      // Set up timeout with remaining time
      timeoutRef.current = setTimeout(() => {
        console.log('Restored timeout reached for:', { requestId: savedRequestId, taskId: savedTaskId });
        
        setHasTimedOut(true);
        clearAll();
        localStorage.removeItem('activeGenerationRequestId');
        localStorage.removeItem('generationTimeoutStart');
        localStorage.removeItem('generationTimeoutRequestId');
        localStorage.removeItem('generationTimeoutTaskId');
        
        showNotification({
          type: 'error',
          title: 'Generarea a durat prea mult',
          message: 'Generarea a depășit timpul maxim permis. Te rugăm să încerci din nou.',
          duration: 30000
        });
        
        cleanupListeners(savedRequestId, savedTaskId);
        
        setActiveRequestId(null);
        setActiveTaskId(null);
        setActiveSongId(null);
        setLatestTaskData(null);
        setLatestGenerationData(null);
      }, remainingTime);
    }
  }, [clearAll, showNotification, cleanupListeners, TIMEOUT_DURATION]);

  // Check for active generations in localStorage
  useEffect(() => {
    const checkActiveGenerations = () => {
      // Check for separately saved requestId first
      const savedRequestId = localStorage.getItem('activeGenerationRequestId');
      
      if (savedRequestId) {
        if (!activeListeners.current.has(savedRequestId)) {
          setupGenerationListener(savedRequestId);
        }
      }
      
      // Also check for loading notifications (backward compatibility)
      const savedNotifications = localStorage.getItem('globalNotifications');
      
      if (savedNotifications) {
        try {
          const notifications = JSON.parse(savedNotifications);
          const loadingNotifications = notifications.filter(n => n.type === 'loading');
          
          loadingNotifications.forEach(notification => {
            const requestId = notification.requestId;
            if (requestId && !activeListeners.current.has(requestId)) {
              setupGenerationListener(requestId);
            }
          });
        } catch (error) {
          console.error('Eroare la citirea notificărilor active:', error);
        }
      }

      // Check and restore timeout on page refresh
      checkAndRestoreTimeout();
    };
    
    checkActiveGenerations();
  }, [setupGenerationListener, checkAndRestoreTimeout]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      // Clear timeout on unmount
      clearGenerationTimeout();
      
      activeListeners.current.forEach(unsubscribe => unsubscribe());
      activeListeners.current.clear();
    };
  }, [clearGenerationTimeout]);

  return {
    setupGenerationListener,
    cleanupListeners,
    // Exposed reactive state
    activeRequestId,
    activeTaskId,
    activeSongId,
    latestTaskData,
    latestGenerationData,
    // Helper function
    isGenerationActive,
    // New timeout state
    hasTimedOut,
    timeoutStartTime
  };
}; 