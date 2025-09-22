// src/lib/pixelDedupe.ts
// Generic client-side dedupe helpers (localStorage/sessionStorage + in-memory fallback)

export const DEFAULT_TTL_MS = 1000 * 60 * 60 * 72; // 72 hours
const KEY_PREFIX = "fb:once:";
const mem = new Map<string, number>();

const now = () => Date.now();

function read(key: string, ttlMs: number): number | null {
    try {
        const raw = localStorage.getItem(key) || sessionStorage.getItem(key);
        if (!raw) return null;
        const parsed = JSON.parse(raw) as { t?: number; ttl?: number };
        const t = typeof parsed.t === "number" ? parsed.t : null;
        const ttl = typeof parsed.ttl === "number" ? parsed.ttl : ttlMs;
        if (!t || now() - t > ttl) return null;
        return t;
    } catch {
        const t = mem.get(key);
        if (!t) return null;
        return now() - t <= ttlMs ? t : null;
    }
}

function write(key: string, ttlMs: number) {
    const payload = JSON.stringify({ t: now(), ttl: ttlMs });
    try {
        localStorage.setItem(key, payload);
        sessionStorage.setItem(key, payload);
    } catch {
        mem.set(key, now());
    }
}

/** Returns true if this dedupeKey has fired within the TTL window. */
export function hasFiredOnce(dedupeKey: string, ttlMs: number = DEFAULT_TTL_MS): boolean {
    const key = KEY_PREFIX + dedupeKey;
    return read(key, ttlMs) != null;
}

/** Marks this dedupeKey as fired (stored with TTL). */
export function markFiredOnce(dedupeKey: string, ttlMs: number = DEFAULT_TTL_MS): void {
    const key = KEY_PREFIX + dedupeKey;
    write(key, ttlMs);
}

/** Runs a function only once per TTL window for the given key. Returns true if executed. */
export function runOnce(dedupeKey: string, fn: () => void, ttlMs: number = DEFAULT_TTL_MS): boolean {
    if (!dedupeKey) {
        fn();
        return true;
    }
    if (hasFiredOnce(dedupeKey, ttlMs)) return false;
    fn();
    markFiredOnce(dedupeKey, ttlMs);
    return true;
}

/** Testing helper: clear a stored marker. */
export function clearOnce(dedupeKey: string): void {
    const key = KEY_PREFIX + dedupeKey;
    try {
        localStorage.removeItem(key);
        sessionStorage.removeItem(key);
    } catch {
        // ignore
    }
    mem.delete(key);
}
