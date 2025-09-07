import { hashKey, QueryKey, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useMemo, useRef, useState } from 'react';

export interface UseRealtimeQueryProps<T> {
    queryKey: QueryKey;
    fetchOnce?: () => Promise<T>;
    subscribe: (onData: (next: T) => void, onError: (e: any) => void) => () => void;
    enabled?: boolean;
    staleTime?: number;
    waitForFirstPush?: boolean;
}

function useLatest<T>(value: T) {
    const ref = useRef(value);
    ref.current = value;
    return ref;
}

export default function useRealtimeQuery<T>({
    queryKey,
    fetchOnce,
    subscribe,
    enabled = true,
    staleTime = Infinity,
    waitForFirstPush = false,
}: UseRealtimeQueryProps<T>) {
    const qc = useQueryClient();

    // Hash is stable for structurally-equal keys even if the array identity changes
    const keyHash = useMemo(() => hashKey(queryKey), [queryKey]);

    // Keep the latest subscribe/callbacks in refs so the effect can depend on the hash only
    const subscribeRef = useLatest(subscribe);
    const keyRef = useLatest(queryKey);

    const firstPushSeenRef = useRef(false);
    const [firstPushAt, setFirstPushAt] = useState<number | null>(null);

    const cached = qc.getQueryData<T>(queryKey);
    const hasCached = cached !== undefined;

    const base = useQuery<T>({
        queryKey,
        queryFn: async () => {
            if (!fetchOnce) throw new Error('No fetchOnce provided');
            return fetchOnce();
        },
        enabled: enabled && !!fetchOnce && !hasCached,
        staleTime,
        refetchOnMount: false,
        refetchOnWindowFocus: false,
        initialData: hasCached ? cached : undefined,
    });

    // Resubscribe only when the **structural** key changes or enabled flips
    useEffect(() => {
        if (!enabled) return;

        const unsub = subscribeRef.current(
            (next) => {
                console.log('useRealtimeQuery: got data');
                if (!firstPushSeenRef.current) {
                    firstPushSeenRef.current = true;
                    setFirstPushAt(Date.now());
                }
                qc.setQueryData<T>(keyRef.current, next); // use the real key, not the hash
            },
            (err) => {
                qc.setQueryData(keyRef.current, (prev: any) => prev ?? undefined);
                qc.setQueryData([...(Array.isArray(keyRef.current) ? keyRef.current : [keyRef.current]), 'error'], err);
            }
        );
        return unsub;
    }, [enabled, qc, keyHash]); // ← use the hash, not the array

    const isReady = useMemo(() => qc.getQueryData<T>(queryKey) !== undefined, [qc, queryKey, base.dataUpdatedAt]);
    const isWaitingForPush = waitForFirstPush && !firstPushSeenRef.current;

    const isLoading =
        enabled &&
        (isWaitingForPush ||
            (!hasCached && !!fetchOnce && base.isPending) ||
            (!fetchOnce && !isReady));

    return {
        ...base,
        isLoading,
        isReady,
        firstPushAt,
    };
}
