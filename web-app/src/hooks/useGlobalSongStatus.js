import { doc, onSnapshot } from 'firebase/firestore';
import { useCallback, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useNotification } from '../context/NotificationContext';
import { db } from '../services/firebase';

// Funcție utilitară pentru ștergerea datelor formularului
const clearFormData = () => {
  const FORM_DATA_KEYS = {
    SELECTED_STYLE: 'generateForm_selectedStyle',
    SONG_NAME: 'generateForm_songName',
    SONG_DETAILS: 'generateForm_songDetails',
    WANTS_DEDICATION: 'generateForm_wantsDedication',
    FROM_NAME: 'generateForm_fromName',
    TO_NAME: 'generateForm_toName',
    DEDICATION: 'generateForm_dedication',
    WANTS_DONATION: 'generateForm_wantsDonation',
    DONOR_NAME: 'generateForm_donorName',
    DONATION_AMOUNT: 'generateForm_donationAmount',
    MODE: 'generateForm_mode',
    IS_ACTIVE: 'generateForm_isActive'
  };
  
  Object.values(FORM_DATA_KEYS).forEach(key => {
    localStorage.removeItem(key);
  });
};

export const useGlobalSongStatus = () => {
  const { showNotification, clearAll } = useNotification();
  const navigate = useNavigate();
  const activeListeners = useRef(new Map());

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

  const setupSongListener = useCallback((songId, requestId, taskId) => {
    const unsubscribe = onSnapshot(
      doc(db, 'songsPublic', songId),
      (docSnap) => {
        if (!docSnap.exists()) {
          return;
        }
        
        const songData = docSnap.data();
        
        // Check if song is complete (has title OR streamAudioUrl)
        if (songData && songData.apiData && (songData.apiData.title || songData.apiData.streamAudioUrl)) {
          clearAll();
          // Clear the saved requestId when song is complete
          localStorage.removeItem('activeGenerationRequestId');
          
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
  }, [clearAll, showNotification, navigate, cleanupListeners]);

  const setupTaskListener = useCallback((taskId, requestId) => {
    const unsubscribe = onSnapshot(
      doc(db, 'taskStatuses', taskId),
      (snap) => {
        if (!snap.exists()) {
          return;
        }
        
        const data = snap.data();
        
        switch (data.status) {
          case 'completed':
            if (data.songId) {
              // Set up song listener
              setupSongListener(data.songId, requestId, taskId);
            }
            break;
          case 'partial':
            if (data.songId) {
              // Set up song listener even for partial status if we have songId
              setupSongListener(data.songId, requestId, taskId);
            }
            break;
          case 'failed':
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
  }, [clearAll, showNotification, setupSongListener, cleanupListeners]);

  const setupGenerationListener = useCallback((requestId) => {
    if (activeListeners.current.has(requestId)) {
      return; // Already listening
    }

    const unsubscribe = onSnapshot(
      doc(db, 'generationRequests', requestId),
      (snap) => {
        if (!snap.exists()) {
          return;
        }
        
        const data = snap.data();
        
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
  }, [setupTaskListener]);

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
    };
    
    checkActiveGenerations();
  }, [setupGenerationListener]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      activeListeners.current.forEach(unsubscribe => unsubscribe());
      activeListeners.current.clear();
    };
  }, []);

  return {
    setupGenerationListener,
    cleanupListeners
  };
}; 