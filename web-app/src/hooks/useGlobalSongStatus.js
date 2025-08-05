import { doc, onSnapshot } from 'firebase/firestore';
import { useCallback, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useNotification } from '../context/NotificationContext';
import { db } from '../services/firebase';

export const useGlobalSongStatus = () => {
  const { showNotification, clearAll } = useNotification();
  const navigate = useNavigate();
  const activeListeners = useRef(new Map());
  
  console.log('useGlobalSongStatus hook initialized');

  const cleanupListeners = useCallback((...ids) => {
    console.log('Cleaning up listeners for ids:', ids);
    ids.forEach(id => {
      const unsubscribe = activeListeners.current.get(id);
      if (unsubscribe) {
        console.log('Cleaning up listener for id:', id);
        unsubscribe();
        activeListeners.current.delete(id);
      } else {
        console.log('No listener found for id:', id);
      }
    });
  }, []);

  const setupSongListener = useCallback((songId, requestId, taskId) => {
    console.log('[NOTIF-DEBUG] GSS: Setez song listener pentru songId:', songId, 'requestId:', requestId, 'taskId:', taskId);
    const unsubscribe = onSnapshot(
      doc(db, 'songsPublic', songId),
      (docSnap) => {
        if (!docSnap.exists()) {
          console.log('[NOTIF-DEBUG] GSS: Song nu există pentru', songId);
          return;
        }
        
        const songData = docSnap.data();
        console.log('[NOTIF-DEBUG] GSS: Date din song:', songData);
        console.log('[NOTIF-DEBUG] GSS: Song are apiData:', !!songData.apiData);
        console.log('[NOTIF-DEBUG] GSS: Song are title:', songData.apiData?.title);
        console.log('[NOTIF-DEBUG] GSS: Song are streamAudioUrl:', songData.apiData?.streamAudioUrl);
        console.log('[NOTIF-DEBUG] GSS: Verificare completă song:', songData && songData.apiData && (songData.apiData.title || songData.apiData.streamAudioUrl));
        
        // Check if song is complete (has title OR streamAudioUrl)
        if (songData && songData.apiData && (songData.apiData.title || songData.apiData.streamAudioUrl)) {
          console.log('[NOTIF-DEBUG] GSS: Song gata, notific succes!');
          console.log('[NOTIF-DEBUG] GSS: Apelez clearAll()');
          clearAll();
          // Clear the saved requestId when song is complete
          localStorage.removeItem('activeGenerationRequestId');
          console.log('[NOTIF-DEBUG] GSS: requestId șters din localStorage la finalizare');
          console.log('[NOTIF-DEBUG] GSS: Apelez showNotification pentru succes');
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
          console.log('[NOTIF-DEBUG] GSS: Notificare de succes apelată');
          
          // Clean up listeners
          cleanupListeners(requestId, taskId, songId);
        } else {
          console.log('[NOTIF-DEBUG] GSS: Song nu e gata încă. Datele sunt:', {
            hasSongData: !!songData,
            hasApiData: !!songData?.apiData,
            hasTitle: !!songData?.apiData?.title,
            hasStreamAudioUrl: !!songData?.apiData?.streamAudioUrl,
            title: songData?.apiData?.title,
            streamAudioUrl: songData?.apiData?.streamAudioUrl
          });
        }
      },
      (err) => {
        console.error('[NOTIF-DEBUG] GSS: Eroare la song listener:', err);
      }
    );

    activeListeners.current.set(songId, unsubscribe);
  }, [clearAll, showNotification, navigate, cleanupListeners]);

  const setupTaskListener = useCallback((taskId, requestId) => {
    console.log('[NOTIF-DEBUG] GSS: Setez task listener pentru taskId:', taskId, 'requestId:', requestId);
    const unsubscribe = onSnapshot(
      doc(db, 'taskStatuses', taskId),
      (snap) => {
        if (!snap.exists()) {
          console.log('[NOTIF-DEBUG] GSS: taskStatus nu există pentru', taskId);
          return;
        }
        
        const data = snap.data();
        console.log('[NOTIF-DEBUG] GSS: Date din taskStatus:', data);
        console.log('[NOTIF-DEBUG] GSS: Task status primit:', data.status);
        console.log('[NOTIF-DEBUG] GSS: Task songId:', data.songId);
        console.log('[NOTIF-DEBUG] GSS: Task createdAt:', data.createdAt);
        console.log('[NOTIF-DEBUG] GSS: Task updatedAt:', data.updatedAt);
        console.log('[NOTIF-DEBUG] GSS: Task toate proprietățile:', Object.keys(data));
        
        switch (data.status) {
          case 'completed':
            console.log('[NOTIF-DEBUG] GSS: Task completed, songId:', data.songId);
            if (data.songId) {
              console.log('[NOTIF-DEBUG] GSS: Apelez setupSongListener pentru songId:', data.songId);
              // Set up song listener
              setupSongListener(data.songId, requestId, taskId);
            } else {
              console.log('[NOTIF-DEBUG] GSS: Task completed dar fără songId');
            }
            break;
          case 'failed':
            console.log('[NOTIF-DEBUG] GSS: Task failed:', data.error);
            // Clear loading notifications and show error
            clearAll();
            // Clear the saved requestId when task fails
            localStorage.removeItem('activeGenerationRequestId');
            console.log('[NOTIF-DEBUG] GSS: requestId șters din localStorage la eroare');
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
            console.log('[NOTIF-DEBUG] GSS: Task processing - aștept finalizare...');
            break;
          case 'partial':
            console.log('[NOTIF-DEBUG] GSS: Task partial - aștept finalizare...');
            break;
          default:
            console.log('[NOTIF-DEBUG] GSS: Task status necunoscut:', data.status);
            break;
        }
      },
      (err) => {
        console.error('[NOTIF-DEBUG] GSS: Eroare la taskStatus listener:', err);
      }
    );

    activeListeners.current.set(taskId, unsubscribe);
  }, [clearAll, showNotification, setupSongListener, cleanupListeners]);

  const setupGenerationListener = useCallback((requestId) => {
    if (activeListeners.current.has(requestId)) {
      console.log('[NOTIF-DEBUG] GSS: Deja există listener pentru requestId:', requestId);
      return; // Already listening
    }

    console.log('[NOTIF-DEBUG] GSS: Setez generation listener pentru requestId:', requestId);
    const unsubscribe = onSnapshot(
      doc(db, 'generationRequests', requestId),
      (snap) => {
        if (!snap.exists()) {
          console.log('[NOTIF-DEBUG] GSS: generationRequest nu există pentru', requestId);
          return;
        }
        
        const data = snap.data();
        console.log('[NOTIF-DEBUG] GSS: Date din generationRequest:', data);
        console.log('[NOTIF-DEBUG] GSS: generationRequest taskId:', data.taskId);
        console.log('[NOTIF-DEBUG] GSS: generationRequest toate proprietățile:', Object.keys(data));
        
        if (data.taskId && !activeListeners.current.has(data.taskId)) {
          console.log('[NOTIF-DEBUG] GSS: Setez task listener pentru taskId:', data.taskId);
          // Set up task status listener
          setupTaskListener(data.taskId, requestId);
        } else if (!data.taskId) {
          console.log('[NOTIF-DEBUG] GSS: generationRequest nu are încă taskId');
        } else {
          console.log('[NOTIF-DEBUG] GSS: Deja există listener pentru taskId:', data.taskId);
        }
      },
      (err) => {
        console.error('[NOTIF-DEBUG] GSS: Eroare la generationRequest listener:', err);
      }
    );

    activeListeners.current.set(requestId, unsubscribe);
    console.log('[NOTIF-DEBUG] GSS: Generation listener setat pentru requestId:', requestId);
  }, [setupTaskListener]);

  // Check for active generations in localStorage
  useEffect(() => {
    const checkActiveGenerations = () => {
      console.log('[NOTIF-DEBUG] GSS: Verificare generări active...');
      
      // Check for separately saved requestId first
      const savedRequestId = localStorage.getItem('activeGenerationRequestId');
      if (savedRequestId) {
        console.log('[NOTIF-DEBUG] GSS: Găsit requestId salvat separat:', savedRequestId);
        if (!activeListeners.current.has(savedRequestId)) {
          console.log('[NOTIF-DEBUG] GSS: Setez listener pentru requestId salvat:', savedRequestId);
          setupGenerationListener(savedRequestId);
        } else {
          console.log('[NOTIF-DEBUG] GSS: Deja există listener pentru requestId salvat:', savedRequestId);
        }
      } else {
        console.log('[NOTIF-DEBUG] GSS: Nu există requestId salvat separat');
      }
      
      // Also check for loading notifications (backward compatibility)
      const savedNotifications = localStorage.getItem('globalNotifications');
      console.log('[NOTIF-DEBUG] GSS: Raw localStorage value:', savedNotifications);
      
      if (savedNotifications) {
        try {
          const notifications = JSON.parse(savedNotifications);
          console.log('[NOTIF-DEBUG] GSS: Toate notificările din localStorage:', notifications);
          const loadingNotifications = notifications.filter(n => n.type === 'loading');
          console.log('[NOTIF-DEBUG] GSS: Notificări loading găsite:', loadingNotifications);
          
          loadingNotifications.forEach(notification => {
            const requestId = notification.requestId;
            if (requestId && !activeListeners.current.has(requestId)) {
              console.log('[NOTIF-DEBUG] GSS: Setez listener pentru requestId din notificare:', requestId);
              setupGenerationListener(requestId);
            } else if (!requestId) {
              console.log('[NOTIF-DEBUG] GSS: Notificare loading fără requestId:', notification);
            } else {
              console.log('[NOTIF-DEBUG] GSS: Deja există listener pentru requestId din notificare:', requestId);
            }
          });
        } catch (error) {
          console.error('[NOTIF-DEBUG] GSS: Eroare la citirea notificărilor active:', error);
        }
      } else {
        console.log('[NOTIF-DEBUG] GSS: Nu există notificări salvate în localStorage');
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