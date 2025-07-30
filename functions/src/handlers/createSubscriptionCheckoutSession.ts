import { HttpsError, onCall } from "firebase-functions/v2/https";
import { REGION, stripe } from "../config";
import { createSubCheckoutSession } from "../service/payment/checkout-session";
import { createCustomer, getCustomerIdByUserId } from "../service/payment/customer";

/**
 * Creates a subscription checkout session.
 * 
 * @param request - The request object containing the generation data and authentication.
 * @returns A promise that resolves to the generation request ID and payment status.
 * @throws HttpsError if the user is not authenticated or if the generation request cannot be created.
 */
export const createSubscriptionCheckoutSession = onCall(
  { region: REGION },
  async (request) => {
    if (!stripe) {
      throw new HttpsError('internal', 'Stripe not initialized');
    }

    const { auth } = request;

    if (!auth || !auth.uid) {
      throw new HttpsError('unauthenticated', 'Not authenticated.');
    }

    let customerId = await getCustomerIdByUserId(auth.uid);
    if (!customerId) {
      // Create a customer
      customerId = await createCustomer(auth.uid, auth.token?.email || '');
    }

    const session = await createSubCheckoutSession(auth.uid, customerId);
    return {
      checkoutUrl: session.url,
      sessionId: session.id,
    };
  }
);