// src/lib/fbPixel.ts
import { grantMetaConsentAndStart, initMetaPixel, revokeMetaConsent, trackMetaPageView, trackMetaPurchase, trackMetaSignUp } from './meta';
import { grantTikTokConsentAndStart, initTikTokPixel, revokeTikTokConsent, trackTikTokPageView, trackTikTokPurchase, trackTikTokSignUp } from './tiktok';
import { getPixelConsent } from './utils/consent';
import { DEFAULT_TTL_MS, hasFiredOnce, markFiredOnce } from './utils/dedupe';

/* -------------------- public API -------------------- */
/**
 * Init the Pixel as early as possible, but start with consent REVOKED.
 * - This loads the library and sets up your Pixel ID.
 * - No cookies/requests will be made until you call grantConsentAndStart().
 */
export function initPixel() {
  initMetaPixel();
  initTikTokPixel();
}

/**
 * Call this ONLY after the user has granted ads/measurement consent.
 * - Flips consent to GRANT
 * - Marks pixel as "ready" so pageView/track/trackCustom will send
 */
export function grantConsentAndStart() {
  grantMetaConsentAndStart();
  grantTikTokConsentAndStart();
}

/** Withdraw consent at any time. Stops tracking immediately. */
export function revokeConsent() {
  revokeMetaConsent();
  revokeTikTokConsent();
}

/**
 * Track a PageView event with client-side dedupe.
 */
export function trackPageView() {
  trackMetaPageView();
  trackTikTokPageView();
}

/**
 * Track a SignUp event with client-side dedupe.
 */
export function trackSignUp(uid: string) {
  if (getPixelConsent() !== 'true') return false;

  const key = `${'CompleteRegistration'}:${uid}`;
  if (hasFiredOnce(key, DEFAULT_TTL_MS)) return false;

  trackMetaSignUp(uid);
  trackTikTokSignUp(uid);

  console.log('CompleteRegistration', uid);
  markFiredOnce(key, DEFAULT_TTL_MS);
  return true;

}

/**
 * Track a Purchase event with client-side dedupe.
 */
export function trackPurchase(
  data: { value: number, currency: string, content_id: string },
  eventId: string
): boolean {
  if (getPixelConsent() !== 'true') return false;

  const key = `${'Purchase'}:${eventId}`;
  if (hasFiredOnce(key, DEFAULT_TTL_MS)) return false;

  trackMetaPurchase(data, eventId);
  trackTikTokPurchase(data, eventId);

  console.log('Purchase', data, { eventID: eventId });
  markFiredOnce(key, DEFAULT_TTL_MS);
  return true;
}

export { getPixelConsent };
