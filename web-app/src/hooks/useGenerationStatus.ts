import { useCallback, useEffect, useMemo, useState } from 'react';
import {
    GenerationStatus,
    GenerationViewData,
    useGenerationViewRealtimeQuery
} from './realtime-query/useGenerationRealtimeQuery';

// ---- Public return type for the hook ----
export interface UseGenerationStatusReturn {
    viewData: GenerationViewData | null;
    isLoadingData: boolean;
    hasGenerationStarted: boolean;
    isGenerationProcessing: boolean;
    isGenerationPartial: boolean;
    isGenerationComplete: boolean;
    isGenerationFailed: boolean;
    generationStatus: GenerationStatus;
    hasTimedOut: boolean;
    activeId: string | null;
    setActiveGenerationId: (requestId: string) => void;
    clearActiveGenerationId: () => void;
}

const TIMEOUT_AFTER_SECONDS = 6 * 60; //  6 minutes
const LS_KEY = 'activeGenerationRequestId';

function readActiveId(): string | null {
    if (typeof window === 'undefined') return null;
    try {
        const val = window.localStorage.getItem(LS_KEY);
        return val || null;
    } catch {
        return null;
    }
}

function writeActiveId(id: string | null) {
    if (typeof window === 'undefined') return;
    try {
        if (id) window.localStorage.setItem(LS_KEY, id);
        else window.localStorage.removeItem(LS_KEY);
    } catch {
        // ignore quota/availability
    }
}

export const useGenerationStatus = (): UseGenerationStatusReturn => {
    const [activeId, setActiveId] = useState<string | null>(() => readActiveId());
    const [timeWhenActiveSet, setTimeWhenActiveSet] = useState<number | null>(null);

    // ⏱ keep a ticking "now" that updates every 5s
    const [now, setNow] = useState(() => Date.now());
    useEffect(() => {
        const id = setInterval(() => setNow(Date.now()), 5000); // 5s tick
        return () => clearInterval(id);
    }, []);

    const setActiveGenerationId = useCallback((requestId: string) => {
        setTimeWhenActiveSet(Date.now());
        setActiveId(requestId);
        writeActiveId(requestId);
    }, []);

    const clearActiveGenerationId = useCallback(() => {
        setTimeWhenActiveSet(null);
        setActiveId(null);
        writeActiveId(null);
    }, []);

    const {
        data: viewData,
        isLoading: isViewLoading
    } = useGenerationViewRealtimeQuery({
        requestId: activeId,
        enabled: !!activeId,
    });

    /*
    * Generation started if there is an activeId, view data present, and generationtStarted=true.
    */
    const hasGenerationStarted = useMemo(() => {
        return activeId && viewData && viewData?.generationStarted === true;
    }, [viewData?.generationStarted, activeId]);

    /*
    * Generation is complete if  status=completed
    */
    const isGenerationComplete = useMemo(() => {
        return viewData?.status === 'completed';
    }, [viewData?.status]);

    /*
    * Generation is failed if paymentStatus=failed or status=failed or error is present.
    */
    const isGenerationFailed = useMemo(() => {
        return (
            viewData?.paymentStatus === 'failed'
            || viewData?.status === 'failed'
            || !!viewData?.error
        )
    }, [viewData?.paymentStatus, viewData?.status, viewData?.error]);

    /*
    * Generation is partial if status=partial
    */
    const isGenerationPartial = useMemo(() => {
        return viewData?.status === 'partial';
    }, [viewData?.status]);

    const generationStatus = useMemo(() => {
        return viewData?.status;
    }, [viewData?.status]);

    const hasTimedOut = useMemo(() => {
        if (isViewLoading || isGenerationComplete) {
            return false;
        }
        if (!hasGenerationStarted) {
            // Use timeout w.r.t. when active id was set
            if (timeWhenActiveSet) {
                const timeSinceActiveSet = now - timeWhenActiveSet;
                return timeSinceActiveSet > TIMEOUT_AFTER_SECONDS * 1000;
            }
            return false;
        };
        if (viewData?.generationStartedAt) {
            // Use timeout w.r.t. when generation started
            const generationStartedAt = viewData?.generationStartedAt?.toDate().getTime() ?? 0;
            const timeSinceGenerationStarted = now - generationStartedAt;
            // console.log('timeSinceGenerationStarted', timeSinceGenerationStarted);
            return timeSinceGenerationStarted > TIMEOUT_AFTER_SECONDS * 1000;
        } else {
            // Use timeout w.r.t. when generation view doc was created
            const timeSinceCreatedAt = now - viewData?.createdAt?.toDate().getTime();
            // console.log('timeSinceCreatedAt', timeSinceCreatedAt);
            return timeSinceCreatedAt > TIMEOUT_AFTER_SECONDS * 1000;
        }
    }, [
        now,
        isViewLoading,
        isGenerationComplete,
        hasGenerationStarted,
        viewData?.generationStartedAt,
        timeWhenActiveSet,
        viewData?.createdAt,
    ]);

    const isGenerationProcessing = useMemo(() => {
        console.log('viewData?.status', viewData?.status);
        return hasGenerationStarted && viewData?.status === 'processing' && !hasTimedOut;
    }, [hasGenerationStarted, viewData?.status, hasTimedOut]);

    return {
        viewData,
        isLoadingData: isViewLoading,
        hasGenerationStarted,
        isGenerationProcessing,
        isGenerationPartial,
        isGenerationComplete,
        isGenerationFailed,
        generationStatus,
        hasTimedOut,
        activeId,
        setActiveGenerationId,
        clearActiveGenerationId,
    };
};
