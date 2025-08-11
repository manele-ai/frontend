import { FieldValue } from "firebase-admin/firestore";
import { logger } from "firebase-functions/v2";
import { HttpsError, onCall } from "firebase-functions/v2/https";
import { db, REGION, stripe } from "../config";
import { COLLECTIONS } from "../constants/collections";
import { createGenerationRequestTransaction } from "../service/generation/generation-request";
import { createSongCheckoutSession } from "../service/payment/checkout-session";
import { createCustomer, getCustomerIdByUserId } from "../service/payment/customer";
import { Requests } from "../types";

/**
 * Creates a generation request and handles checkout url creation.
 * - checks if user has credits
 * - if user has credits, creates a generation request with payment status 'success' and decrements the user's credits
 * - if user doesn't have credits, creates a checkout url and creates a generation request with payment status 'pending'
 * - updates the generation request with the checkout url
 * - returns the generation request ID and payment status
 * 
 * @param request - The request object containing the generation data and authentication.
 * @returns A promise that resolves to the generation request ID and payment status.
 * @throws HttpsError if the user is not authenticated or if the generation request cannot be created.
 */
export const createGenerationRequest = onCall<Requests.GenerateSong>(
  { 
    region: REGION,
    enforceAppCheck: true,
  },
  async (request) => {
    if (!stripe) {
      throw new HttpsError('internal', 'Stripe not initialized');
    }

    const { data, auth } = request;

    if (!auth || !auth.uid) {
      throw new HttpsError('unauthenticated', 'Not authenticated.');
    }

    let customerId = await getCustomerIdByUserId(auth.uid);
    if (!customerId) {
      // Create a customer
      customerId = await createCustomer(auth.uid, auth.token?.email || '');
    }
    

    try {
      const {
        requestId,
        songPaymentType,
        dedicationPaymentType,
        aruncaCuBaniAmountToPay,
        paymentStatus
      } = await createGenerationRequestTransaction(auth.uid, data);
   
      // If payment not needed, return immediately
      if (paymentStatus === 'success') {
        return { requestId, paymentStatus };
      }

      const applySubscriptionDiscount = songPaymentType === 'subscription_discount' ;

      // Create a Stripe session
      try {
          const session = await createSongCheckoutSession({
            userId: auth.uid,
            customerId,
            requestId,
            shouldPayDedication: dedicationPaymentType === 'onetime',
            aruncaCuBaniAmountToPay: aruncaCuBaniAmountToPay || 0,
            applySubscriptionDiscount,
          });
          // Attach Stripe session id to generation request
          await db.collection(COLLECTIONS.GENERATION_REQUESTS)
            .doc(requestId)
            .update({
              paymentSessionId: session.id,
              updatedAt: FieldValue.serverTimestamp()
            });

          return {
            requestId,
            paymentStatus: 'pending',
            checkoutUrl: session.url,
            sessionId: session.id
          };
      } catch (error) {
        // Note: don't worry about credit refund here because we returned early if credits used
        logger.error('Error in createGenerationRequest:', error);
        // If Stripe fails, mark the request as failed
        await db.collection(COLLECTIONS.GENERATION_REQUESTS)
          .doc(requestId)
          .update({
            paymentStatus: 'failed',
            error: 'Failed to create payment session',
            updatedAt: FieldValue.serverTimestamp()
          });
        throw new HttpsError('internal', 'Failed to create payment session');
      }
    } catch (error) {
      logger.error('Error in createGenerationRequest:', error);
      if (error instanceof HttpsError) {
        throw error;
      }
      throw new HttpsError('internal', 'Failed to create generation request');
    }
  }
);