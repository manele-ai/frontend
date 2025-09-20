// src/lib/fbPixel.ts
import { DEFAULT_TTL_MS, hasFiredOnce, markFiredOnce } from './dedupe';

export type AdvancedMatching = Record<string, unknown>;

const pixelId = process.env.REACT_APP_META_PIXEL_ID;

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
    n.loaded = true;
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
/**
 * Init the Pixel as early as possible, but start with consent REVOKED.
 * - This loads the library and sets up your Pixel ID.
 * - No cookies/requests will be made until you call grantConsentAndStart().
 * - We DO NOT send PageView here anymore.
 */
export function initPixel(advancedMatching?: AdvancedMatching) {
  if (!pixelId) {
    if (process.env.NODE_ENV !== 'production') {
      // eslint-disable-next-line no-console
      console.warn('[Meta Pixel] Missing REACT_APP_META_PIXEL_ID; skipping init.');
    }
    return;
  }
  ensureFbqLoaded();
  if (isPixelGranted()) {
    window.fbq?.('consent', 'grant');
  } else {
    window.fbq?.('consent', 'revoke');
  }
  // Init but keep tracking paused
  window.fbq?.('init', pixelId, advancedMatching || {});
  // Keep autoConfig behavior similar to your previous logic
  window.fbq?.('set', 'autoConfig', true, pixelId);
}

/**
 * Call this ONLY after the user has granted ads/measurement consent.
 * - Flips consent to GRANT
 * - Fires initial PageView
 * - Marks pixel as "ready" so pageView/track/trackCustom will send
 */
export function grantConsentAndStart() {
  ensureFbqLoaded(); // safe if script was removed previously
  window.fbq?.('consent', 'grant');
  window.fbq?.('track', 'PageView');
}

export function isPixelGranted() {
  const hasConsent = localStorage.getItem('cookieConsent');
  return hasConsent === 'true';
}

export function pageView() {
  window.fbq?.('track', 'PageView');
}

/**
 * Track a standard Meta event with client-side dedupe (UNCHANGED logic).
 * Signature stays: (event, data, eventId)
 */
export function track(
  event: string,
  data: Record<string, any> = {},
  eventId: string
): boolean {
  if (!isPixelGranted()) return false;

  const key = `${event}:${eventId}`;
  if (hasFiredOnce(key, DEFAULT_TTL_MS)) return false;
  window.fbq?.('track', event, data, { eventID: eventId });
  console.log(event, data, { eventID: eventId });
  markFiredOnce(key, DEFAULT_TTL_MS);
  return true;
}

/** Track a custom event — NO dedupe here by design (UNCHANGED). */
export function trackCustom(event: string, params: Record<string, any> = {}) {
  window.fbq?.('trackCustom', event, params);
}

/** Withdraw consent at any time. Stops tracking immediately. */
export function revokeConsent() {
  window.fbq('consent', 'revoke');
}

/* -------------------- consent helpers -------------------- */
// (Best-effort) remove the fb script tag if it was injected
// function removeFbScript() {
//   const scripts = Array.from(document.getElementsByTagName('script'));
//   scripts
//     .filter(
//       (s) =>
//         (s.src || '').includes('connect.facebook.net') &&
//         (s.src || '').includes('fbevents.js')
//     )
//     .forEach((s) => s.parentNode?.removeChild(s));
// }