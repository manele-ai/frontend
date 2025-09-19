// src/lib/fbPixel.ts
import { DEFAULT_TTL_MS, hasFiredOnce, markFiredOnce } from './dedupe';

// If you had a type from react-facebook-pixel, replace it with a simple record:
export type AdvancedMatching = Record<string, unknown>;

const pixelId = process.env.REACT_APP_META_PIXEL_ID;
let pixelReady = false;

declare global {
    interface Window {
        fbq?: (...args: any[]) => void;
        _fbq?: any;
    }
}

/* -------------------- internal: load fbq script once -------------------- */
function ensureFbqLoaded() {
    if (window.fbq) return;

    (function (f: any, b: any, e: any, v: any, n?: any, t?: any, s?: any) {
        if (f.fbq) return;
        n = f.fbq = function () {
            n.callMethod ? n.callMethod.apply(n, arguments) : n.queue.push(arguments);
        };
        if (!f._fbq) f._fbq = n;
        n.push = n;
        n.loaded = false;
        n.version = '2.0';
        n.queue = [];
        t = b.createElement(e);
        t.async = true;
        t.src = 'https://connect.facebook.net/en_US/fbevents.js';
        s = b.getElementsByTagName(e)[0];
        s.parentNode.insertBefore(t, s);
    })(window, document, 'script', null);
}

/* -------------------- public API -------------------- */
export function initPixel(advancedMatching?: AdvancedMatching) {
    if (pixelReady) return;
    if (!pixelId) {
        if (process.env.NODE_ENV !== 'production') {
            // eslint-disable-next-line no-console
            console.warn('[Meta Pixel] Missing REACT_APP_META_PIXEL_ID; skipping init.');
        }
        return;
    }

    ensureFbqLoaded();
    console.log(pixelId);
    window.fbq?.('init', pixelId, advancedMatching || {});

    // Optional: keep autoConfig behavior similar to the lib defaults
    window.fbq?.('set', 'autoConfig', true, pixelId);

    // Initialize PageView
    window.fbq?.('track', 'PageView');

    pixelReady = true;
}

export function isPixelReady() {
    return pixelReady && typeof window.fbq === 'function';
}

export function pageView() {
    if (!isPixelReady()) return;
    window.fbq?.('track', 'PageView');
}

/**
 * Track a standard Meta event with client-side dedupe (ONLY here).
 * Keep your simplified signature: (event, eventId?)
 *
 * - If eventId is provided, we:
 *   1) build a dedupe key `${event}:${eventId}`
 *   2) skip if already fired within TTL
 *   3) send fbq('track', event, {}, { eventID })
 *   4) mark as fired
 * - If eventId is missing, we just send fbq('track', event) (no dedupe).
 */
export function track(
    event: string,
    data: Record<string, any> = {},
    eventId: string
): boolean {
    if (!isPixelReady()) return false;

    const key = `${event}:${eventId}`;
    if (hasFiredOnce(key, DEFAULT_TTL_MS)) return false;

    window.fbq?.('track', event, data, { eventID: eventId });
    console.log('track', event, data, { eventID: eventId });
    markFiredOnce(key, DEFAULT_TTL_MS);
    return true;
}

/** Track a custom event — NO dedupe here by design. */
export function trackCustom(event: string, params: Record<string, any> = {}) {
    if (!isPixelReady()) return;
    window.fbq?.('trackCustom', event, params);
}

/* -------------------- consent helpers -------------------- */
// (Best-effort) remove the fb script tag if it was injected
function removeFbScript() {
    const scripts = Array.from(document.getElementsByTagName('script'));
    scripts
        .filter(
            (s) =>
                (s.src || '').includes('connect.facebook.net') &&
                (s.src || '').includes('fbevents.js')
        )
        .forEach((s) => s.parentNode?.removeChild(s));
}

export function revokeConsent() {
    if (typeof window.fbq === 'function') {
        // Official consent API call
        window.fbq('consent', 'revoke');
    }
    removeFbScript();
}
