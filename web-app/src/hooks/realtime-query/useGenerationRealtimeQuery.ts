// src/hooks/useGeneration.ts
import { Timestamp } from 'firebase/firestore';
import { subscribeToDoc } from 'services/firebase/listeners';
import useRealtimeQuery from './useRealtimeQuery';

export interface UserGenerationInput {
    style: string;
    title: string;
    lyricsDetails?: string;
    from?: string;
    to?: string;
    dedication?: string;
    wantsDedication?: boolean;
    wantsDonation?: boolean;
    donorName?: string;
    donationAmount?: number;
}
export type GenerationStatus =
    | 'processing'
    | 'partial'
    | 'completed'
    | 'failed';

export interface GenerationViewData {
    userId: string;
    paymentStatus: 'pending' | 'success' | 'failed';
    status?: GenerationStatus;
    taskId?: string;
    createdAt: Timestamp;
    generationStarted: boolean;
    generationStartedAt?: Timestamp;
    generationCompletedAt?: Timestamp;
    error?: string;
    lyrics?: string;
    songIds?: string[];
    songById?: Record<string, {
        id: string;
        streamAudioUrl: string;
        audioUrl?: string;
        imageUrl: string;
        title: string;
        duration: number;
        storage?: {
            url: string;
            path: string;
            sizeBytes: number;
            contentType: string;
        };
    }>;
    userGenerationInput: UserGenerationInput;
}

export function useGenerationViewRealtimeQuery({ requestId, enabled = true }: { requestId: string, enabled?: boolean }) {
    const subscribeFn = (onData: (data: any) => void, onError: (error: any) => void) => {
        return subscribeToDoc('generationViews', requestId, onData, onError);
    }
    return useRealtimeQuery<GenerationViewData>({
        queryKey: ['generationViews', requestId],
        subscribe: subscribeFn,
        enabled,
    });
}

export interface GenerationRequestData {
    taskId?: string;
    paymentStatus?: string;  // we only check 'failed'
    refundedAsCredit?: boolean;
    error?: string;
    generationStarted?: boolean;
    generationStartedAt?: Timestamp;
}

export function useGenerationRequestRealtimeQuery({ requestId, enabled = true }: { requestId: string, enabled?: boolean }) {
    const subscribeFn = (onData: (data: any) => void, onError: (error: any) => void) => {
        return subscribeToDoc('generationRequests', requestId, onData, onError);
    }
    return useRealtimeQuery<GenerationRequestData>({
        queryKey: ['generationRequests', requestId],
        subscribe: subscribeFn,
        enabled,
    });
}

export type TaskStatusValue = 'processing' | 'partial' | 'completed' | 'failed';
export interface TaskStatusData {
    status?: TaskStatusValue;
    error?: string;
    songId?: string;
    songIds?: string[];
}

export function useTaskStatusRealtimeQuery({ taskId, enabled = true }: { taskId: string, enabled?: boolean }) {
    const subscribeFn = (onData: (data: any) => void, onError: (error: any) => void) => {
        return subscribeToDoc('taskStatuses', taskId, onData, onError);
    }
    return useRealtimeQuery<TaskStatusData>({
        queryKey: ['taskStatuses', taskId],
        subscribe: subscribeFn,
        enabled,
    });
}

export interface SongApiData {
    title?: string;
    streamAudioUrl?: string;
}
export interface SongPublicData {
    apiData?: SongApiData;
}

export function useSongRealtimeQuery({ songId, enabled = true }: { songId: string, enabled?: boolean }) {
    const subscribeFn = (onData: (data: any) => void, onError: (error: any) => void) => {
        return subscribeToDoc('songsPublic', songId, onData, onError);
    }
    return useRealtimeQuery<SongPublicData>({
        queryKey: ['songsPublic', songId],
        subscribe: subscribeFn,
        enabled,
    });
}
