// hooks/useRealtimeQuery.ts
import { QueryKey, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';

export interface UseRealtimeQueryProps<T> {
    queryKey: QueryKey;
    fetchOnce?: () => Promise<T>;
    subscribe: (onData: (next: T) => void, onError: (e: any) => void) => () => void;
    enabled?: boolean;
    staleTime?: number;
}
/**
 * useRealtimeQuery
 * - seeds the cache with an optional initial fetch
 * - subscribes to a realtime source (onSnapshot)
 * - pipes pushes into TanStack Query cache
 * - deletes the listener when the component unmounts
 */
export default function useRealtimeQuery<T>({
    queryKey,
    fetchOnce,
    subscribe,
    enabled = true,
    staleTime = Infinity, // let the server push keep it “fresh”
}: UseRealtimeQueryProps<T>) {
    const qc = useQueryClient();

    // 1) Seed cache (optional)
    const q = useQuery<T>({
        queryKey,
        queryFn: async () => {
            if (!fetchOnce) throw new Error('No fetchOnce provided');
            return fetchOnce();
        },
        enabled: enabled && !!fetchOnce,
        staleTime,
        refetchOnMount: false,
        refetchOnWindowFocus: false,
    });

    // 2) Live subscribe and write pushes into cache
    useEffect(() => {
        if (!enabled) return;
        const unsub = subscribe(
            (next) => {
                qc.setQueryData<T>(queryKey, (prev) => {
                    // merge or replace – Firestore doc snapshots are full docs, so replace is fine
                    return next;
                });
            },
            (err) => {
                // surface the error in the cache so consumers see isError
                qc.setQueryData(queryKey, (prev: any) => prev); // no-op write to ensure key exists
                qc.setQueryData([...(queryKey as any), 'error'], err);
            }
        );
        return unsub;
    }, [enabled, qc, JSON.stringify(queryKey)]);

    return q; // { data, isLoading, isError, ... }
}
