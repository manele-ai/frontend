// src/lib/fbPixel.ts
import ReactPixel, { AdvancedMatching } from 'react-facebook-pixel';

const pixelId = process.env.REACT_APP_META_PIXEL_ID;
let pixelReady = false;

export function initPixel(advancedMatching?: AdvancedMatching) {
    if (pixelReady) return;

    // You can tweak options; keep autoConfig on for standard behavior
    const options = {
        autoConfig: true,   // set to false if you want full manual control
        debug: false,
    };

    ReactPixel.init(pixelId, advancedMatching, options);
    ReactPixel.pageView(); // initial page (SPA landing)
    pixelReady = true;
}

export function isPixelReady() {
    return pixelReady;
}

export function pageView() {
    if (!pixelReady) return;
    ReactPixel.pageView();
}

export function track(event: string, params: Record<string, any> = {}) {
    if (!pixelReady) return;
    ReactPixel.track(event, params);
}

export function trackCustom(event: string, params: Record<string, any> = {}) {
    if (!pixelReady) return;
    ReactPixel.trackCustom(event, params);
}

// (Best-effort) remove the fb script tag if it was injected
function removeFbScript() {
    const scripts = Array.from(document.getElementsByTagName('script'));
    scripts
        .filter(s => (s.src || '').includes('connect.facebook.net') && (s.src || '').includes('fbevents.js'))
        .forEach(s => s.parentNode?.removeChild(s));
}

export function revokeConsent() {
    if (!pixelReady) return;
    ReactPixel.revokeConsent();
    // Fallback
    removeFbScript();
}
