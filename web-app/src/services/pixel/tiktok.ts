import { getPixelConsent } from './utils/consent';

const pixelId = process.env.REACT_APP_TIKTOK_PIXEL_ID;

declare global {
    interface Window {
        ttq?: {
            load: (pixelId: string, options?: any) => void;
            page: () => void;
            track: (event: string, data?: any, options?: any) => void;
            identify: (data: any) => void;
            grantConsent: () => void;
            revokeConsent: () => void;
            holdConsent: () => void;
        };
        _ttq?: any;
    }
}

export function ensureTtqLoaded() {
    if (typeof window === "undefined") return;
    if (window.ttq) return; // already loaded

    (function (w: any, d: Document, t: string) {
        w.TiktokAnalyticsObject = t;
        const ttq = (w[t] = w[t] || []);
        ttq.methods = ["page", "track", "identify", "instances", "debug", "on", "off", "once", "ready", "alias", "group", "enableCookie", "disableCookie", "holdConsent", "revokeConsent", "grantConsent"];
        ttq.setAndDefer = function (t: any, e: string) { t[e] = function () { t.push([e].concat(Array.prototype.slice.call(arguments, 0))) } };
        for (let i = 0; i < ttq.methods.length; i++) ttq.setAndDefer(ttq, ttq.methods[i]);
        ttq.instance = function (t: string) {
            const e = ttq._i[t] || [];
            for (let n = 0; n < ttq.methods.length; n++) ttq.setAndDefer(e, ttq.methods[n]);
            return e;
        };
        ttq.load = function (e: string, n?: any) {
            const r = "https://analytics.tiktok.com/i18n/pixel/events.js";
            const s = d.createElement("script");
            ttq._i = ttq._i || {};
            ttq._i[e] = [];
            ttq._i[e]._u = r;
            ttq._t = ttq._t || {};
            ttq._t[e] = +new Date();
            ttq._o = ttq._o || {};
            ttq._o[e] = n || {};
            s.type = "text/javascript";
            s.async = true;
            s.src = r + "?sdkid=" + e + "&lib=" + t;
            const f = d.getElementsByTagName("script")[0];
            f.parentNode?.insertBefore(s, f);
        };
        w.ttq = ttq;
    })(window as any, document, "ttq");
}

export function initTikTokPixel() {
    if (!pixelId) {
        if (process.env.NODE_ENV !== 'production') {
            // eslint-disable-next-line no-console
            console.warn('[TikTok Pixel] Missing REACT_APP_TIKTOK_PIXEL_ID; skipping init.');
        }
        return;
    }
    ensureTtqLoaded();
    window.ttq?.load(pixelId);

    const consent = getPixelConsent();
    if (consent === 'true') {
        window.ttq?.grantConsent();
    } else if (consent === 'false') {
        window.ttq?.revokeConsent();
    } else {
        window.ttq?.holdConsent();
    }
}

export function grantTikTokConsentAndStart() {
    ensureTtqLoaded();
    window.ttq?.grantConsent();
    window.ttq?.page();
}

export function revokeTikTokConsent() {
    window.ttq?.revokeConsent();
}

export function trackTikTokPageView() {
    window.ttq?.page();
}

export function trackTikTokSignUp(eventId: string) {
    window.ttq?.track('CompleteRegistration', { eventID: eventId });
}

export function trackTikTokPurchase(
    data: { value: number, currency: string, content_id: string },
    eventId: string
) {
    window.ttq?.track('Purchase', data, { eventID: eventId });
}
