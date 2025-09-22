import { getPixelConsent } from './utils/consent';

export type AdvancedMatching = Record<string, unknown>;

const pixelId = process.env.REACT_APP_META_PIXEL_ID;

declare global {
    interface Window {
        fbq?: (...args: any[]) => void;
        _fbq?: any;
    }
}

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

export function initMetaPixel(advancedMatching?: AdvancedMatching) {
    if (!pixelId) {
        if (process.env.NODE_ENV !== 'production') {
            // eslint-disable-next-line no-console
            console.warn('[Meta Pixel] Missing REACT_APP_META_PIXEL_ID; skipping init.');
        }
        return;
    }
    ensureFbqLoaded();
    if (getPixelConsent() === 'true') {
        window.fbq?.('consent', 'grant');
    } else {
        window.fbq?.('consent', 'revoke');
    }
    // Init but keep tracking paused
    window.fbq?.('init', pixelId, advancedMatching || {});
    window.fbq?.('set', 'autoConfig', true, pixelId);
}

export function grantMetaConsentAndStart() {
    ensureFbqLoaded();
    window.fbq?.('consent', 'grant');
    window.fbq?.('track', 'PageView');
}

export function revokeMetaConsent() {
    window.fbq('consent', 'revoke');
}

export function trackMetaPageView() {
    window.fbq?.('track', 'PageView');
}

export function trackMetaSignUp(eventId: string) {
    window.fbq?.('track', 'CompleteRegistration', { eventID: eventId });
}

export function trackMetaPurchase(
    data: { value: number, currency: string },
    eventId: string
) {
    window.fbq?.('track', 'Purchase', data, { eventID: eventId });
}