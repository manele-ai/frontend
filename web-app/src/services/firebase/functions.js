import { Timestamp } from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';
import { functions } from './index';

/**
 * Creates a generation request and handles payment if needed
 * @param {object} data Generation parameters
 * @returns {Promise<{requestId: string, paymentStatus: 'success' | 'pending', checkoutUrl?: string, sessionId?: string}>}
 */
export const createGenerationRequest = async (data) => {
  const fn = httpsCallable(functions, 'createGenerationRequest', { limitedUseAppCheckTokens: true });
  const result = await fn(data);
  return /** @type {{requestId: string, paymentStatus: 'success' | 'pending', checkoutUrl?: string, sessionId?: string}} */ (result.data);
};

/**
 * Create a Stripe checkout session for purchasing a subscription.
 * @returns {Promise<{checkoutUrl: string, sessionId: string}>}
 */
export const createSubscriptionCheckoutSession = async () => {
  const fn = httpsCallable(functions, 'createSubscriptionCheckoutSession', { limitedUseAppCheckTokens: true });
  const result = await fn();
  return /** @type {{checkoutUrl: string, sessionId: string}} */ (result.data);
};

/**
 * Syncs the generation status for a user.
 * @returns {Promise<{updates: {songId?: string, taskId: string, status: string}[]}}>}
 */
export const syncGenerationStatusForUser = async () => {
  const fn = httpsCallable(functions, 'syncGenerationStatusForUser', { limitedUseAppCheckTokens: true });
  const result = await fn();
  return /** @type {{updates: {songId?: string, taskId: string, status: string}[]}} */ (result.data);
};

/**
 * Creates a user if they don't exist.
 * @param {object} data
 */
export const createUserIfNotExists = async (data) => {
  const fn = httpsCallable(functions, 'createUserIfNotExists', { limitedUseAppCheckTokens: true });
  const result = await fn(data);
  return /** @type {{existed: boolean, profile: {uid: string, displayName: string, photoURL: string, createdAt: Timestamp, updatedAt: Timestamp, stats: {numSongsGenerated: number, numDedicationsGiven: number, sumDonationsTotal: number}}}} */ (result.data);
};

/**
 * Updates a user's profile.
 * @param {object} data
 * @returns {Promise<{displayName: string, photoURL: string}>}
 */
export const updateUserProfile = async (data) => {
  const fn = httpsCallable(functions, 'updateUserProfile', { limitedUseAppCheckTokens: true });
  const result = await fn(data);
  return /** @type {{displayName: string, photoURL: string}} */ (result.data);
};