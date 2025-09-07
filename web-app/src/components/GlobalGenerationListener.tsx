// src/app/GlobalGenerationListener.tsx
import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useNotification } from '../context/NotificationContext';
import { useGenerationStatus } from '../hooks/useGenerationStatus';

const clearFormData = () => {
    // optional: match your previous behavior
    const EASY = ['easyForm_selectedStyle', 'easyForm_songName', 'easyForm_isActive'];
    const COMPLEX = [
        'complexForm_selectedStyle', 'complexForm_songName', 'complexForm_songDetails',
        'complexForm_wantsDedication', 'complexForm_fromName', 'complexForm_toName',
        'complexForm_dedication', 'complexForm_wantsDonation', 'complexForm_donorName',
        'complexForm_donationAmount', 'complexForm_isActive',
    ];
    [...EASY, ...COMPLEX].forEach(k => { try { localStorage.removeItem(k); } catch { } });
};


export default function GlobalGenerationListener() {
    const {
        viewData,
        isLoadingData,
        isGenerationComplete,
        isGenerationFailed,
        generationStatus,
        hasTimedOut,
        activeId,
        setActiveGenerationId,
        clearActiveGenerationId,
    } = useGenerationStatus();

    const { showNotification, clearAllNotifications } = useNotification();
    const navigate = useNavigate();

    // Dedup guards across the same request id
    const seen = useRef({
        processing: new Set<string>(),
        partial: new Set<string>(),
        failed: new Set<string>(),
        success: new Set<string>(),
        timeout: new Set<string>(),
    });

    // Status-driven notifications
    useEffect(() => {
        const id = activeId;
        const st = generationStatus;

        if (!id || !st) return;
        if (isLoadingData) return;

        if (st === 'processing' && !seen.current.processing.has(id)) {
            seen.current.processing.add(id);
            showNotification({
                type: 'loading',
                title: 'Se generează manelele...',
                message: 'AI-ul compune piesele tale.',
                duration: 10000,
            });
        }

        if (st === 'partial' && !seen.current.partial.has(id)) {
            seen.current.partial.add(id);
            clearFormData();
            showNotification({
                type: 'info',
                title: 'Poți asculta maneaua ta',
                message: 'Încă se generează piesele, dar le poți asculta deja.',
                duration: 15000,
                action: {
                    label: 'Ascultă',
                    onClick: () => navigate('/result', { state: { requestId: id, songId: viewData?.songIds[0] } }),
                },
            });
            clearFormData();
        }

        if (st === 'failed' && !seen.current.failed.has(id)) {
            seen.current.failed.add(id);
            clearAllNotifications();
            showNotification({
                type: 'error',
                title: 'Generarea a eșuat',
                message: 'Nu te îngrijora, poți încerca din nou fără sa plătești.',
                duration: 30000,
            });
            clearActiveGenerationId(); // unsubscribe globally
        }

        if (st === 'completed' && !seen.current.success.has(id)) {
            seen.current.success.add(id);
            clearAllNotifications();
            showNotification({
                type: 'success',
                title: 'Maneaua ta e complet gata!',
                message: 'Acum o poți descărca și da share la piesă.',
                action: {
                    label: 'Ascultă',
                    onClick: () => navigate('/result', { state: { requestId: id, songId: viewData?.songIds[0] } }),
                },
                duration: 30000,
            });
            clearFormData();
            clearActiveGenerationId(); // unsubscribe globally
        }
    }, [
        activeId,
        generationStatus,
        showNotification,
        clearAllNotifications,
        clearActiveGenerationId,
        isLoadingData,
    ]);

    // Timeout handling (server should enforce; client shows UX)
    useEffect(() => {
        const id = activeId;
        if (!id || !hasTimedOut) return;

        if (!seen.current.timeout.has(id)) {
            clearAllNotifications();
            showNotification({
                type: 'error',
                title: 'Generarea a durat prea mult',
                message: 'Nu te îngrijora, poți încerca din nou fără sa plătești.',
                duration: 30000,
            });
            seen.current.timeout.add(id);
        }
        clearActiveGenerationId(); // unsubscribe globally
    }, [activeId, hasTimedOut, showNotification, clearAllNotifications, clearActiveGenerationId]);

    return null; // headless
}
