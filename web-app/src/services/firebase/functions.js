import { httpsCallable } from 'firebase/functions';
import { functions } from './index';

/**
 * Creates a generation request and handles payment if needed
 * @param {object} data Generation parameters
 * @returns {Promise<{requestId: string, paymentStatus: 'success' | 'pending', checkoutUrl?: string}>}
 */
export const createGenerationRequest = async (data) => {
  const fn = httpsCallable(functions, 'createGenerationRequest');
  const result = await fn(data);
  return /** @type {{requestId: string, paymentStatus: 'success' | 'pending', checkoutUrl?: string}} */ (result.data);
};

/**
 * @param {object} data
 * @returns {Promise<{taskId: string, externalTaskId: string}>}
 */
export const generateSong = async (data) => {
  const generateSongFunction = httpsCallable(functions, 'generateSong');
  const result = await generateSongFunction(data);
  return /** @type {{taskId: string, externalTaskId: string}} */ (result.data);
};

/**
 * Create a Stripe checkout session for purchasing credits.
 * @param {{credits: number}} data
 * @returns {Promise<{sessionId: string, url: string}>}
 */
export const createStripeCheckoutSession = async (data) => {
  const fn = httpsCallable(functions, 'createStripeCheckoutSession');
  const result = await fn(data);
  return /** @type {{sessionId: string, url: string}} */ (result.data);
};