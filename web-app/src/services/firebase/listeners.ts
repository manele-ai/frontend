import { doc, DocumentData, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';

type Key = string;
type DataCb<T> = (data: T) => void;
type ErrCb = (e: any) => void;

type Entry<T> = {
    subscribers: Set<DataCb<T>>;
    errSubscribers: Set<ErrCb>;
    count: number;
    unsubscribe?: () => void;
};

const REG = new Map<Key, Entry<any>>();

/**
 * Ensures there is at most one Firestore onSnapshot for a (col,id) across the app.
 * Adds/removes subscribers and ref-counts; when count hits 0, it unsubscribes.
 * 
 * WARNING: use within useEffect hooks for thread-safety!
 */
export function subscribeToDoc<T = DocumentData>(
    col: string,
    id: string,
    onData: DataCb<T>,
    onError?: ErrCb
): () => void {
    const key = `${col}/${id}`;
    let entry = REG.get(key) as Entry<T> | undefined;

    // If there is no entry for this key, create one
    if (!entry) {
        entry = {
            subscribers: new Set<DataCb<T>>(),
            errSubscribers: new Set<ErrCb>(),
            count: 0,
            unsubscribe: undefined,
        };

        // Create the single Firestore listener for this key
        entry.unsubscribe = onSnapshot(
            doc(db, col, id),
            (snap) => {
                if (!snap.exists()) return;
                const data = snap.data() as T;
                entry!.subscribers.forEach((cb) => {
                    try {
                        cb(data);
                    } catch (e) {
                        // swallow user callback errors so one bad consumer doesn't break others
                        console.error('[subscribeToDoc] Error during onData callback', e);
                    }
                });
            },
            (err) => {
                // Fan-out errors to subscribers that provided an error handler
                if (entry) {
                    entry.errSubscribers.forEach((cb) => {
                        try {
                            cb(err);
                        } catch (e) {
                            console.error('[subscribeToDoc] Error during onError callback', e);
                        }
                    });
                } else {
                    console.error(`[subscribeToDoc] onSnapshot error for ${key}`, err);
                }
            }
        );

        REG.set(key, entry);
    }

    // Attach this subscriber
    entry.subscribers.add(onData);
    if (onError) entry.errSubscribers.add(onError);
    entry.count += 1;

    // Return cleanup for this subscriber
    return () => {
        const curr = REG.get(key) as Entry<T> | undefined;
        if (!curr) return;

        curr.subscribers.delete(onData);
        if (onError) curr.errSubscribers.delete(onError);
        curr.count = Math.max(0, curr.count - 1);

        if (curr.count === 0) {
            try {
                curr.unsubscribe?.();
            } finally {
                REG.delete(key);
            }
        } else {
            REG.set(key, curr);
        }
    };
}
