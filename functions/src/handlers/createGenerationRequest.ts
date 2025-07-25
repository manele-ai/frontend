import { FieldValue } from "firebase-admin/firestore";
import { HttpsError, onCall } from "firebase-functions/v2/https";
import Stripe from 'stripe';
import { db, frontendBaseUrl, REGION, stripePriceId, stripeSecretKey } from "../config";
import { COLLECTIONS } from "../constants/collections";
import { Database, Requests } from "../types";

const stripe = new Stripe(stripeSecretKey.value(), {} as any);

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
  { region: REGION },
  async (request) => {
    const { data, auth } = request;

    if (!auth) {
      throw new HttpsError('unauthenticated', 'Not authenticated.');
    }

    try {
      const result = await db.runTransaction(async (transaction) => {
        // 1. Read user's credits
        const userRef = db.collection(COLLECTIONS.USERS).doc(auth.uid);
        const userDoc = await transaction.get(userRef);
        
        if (!userDoc.exists) {
          throw new HttpsError('not-found', 'User not found');
        }

        const userData = userDoc.data() as Database.User;
        const hasCredits = (userData.numCredits || 0) >= 1;

        // 2. Create the generation request document
        const generationRequestRef = db.collection(COLLECTIONS.GENERATION_REQUESTS).doc();
        const now = FieldValue.serverTimestamp();

        const generationRequest: Database.GenerationRequest = {
          userId: auth.uid,
          paymentStatus: hasCredits ? 'success' : 'pending',
          createdAt: now as any,
          updatedAt: now as any,
          userGenerationInput: {
            style: data.style,
            title: data.title,
            from: data.from,
            to: data.to,
            dedication: data.dedication,
            wantsDedication: data.wantsDedication,
            wantsDonation: data.wantsDonation,
            donationAmount: data.donationAmount
          }
        };

        // 3. If user has credits, decrement them in the same transaction
        if (hasCredits) {
          transaction.update(userRef, {
            numCredits: FieldValue.increment(-1),
            updatedAt: now
          });
        }

        // 4. Write the generation request
        transaction.set(generationRequestRef, generationRequest);

        return {
          requestId: generationRequestRef.id,
          hasCredits
        };
      });

      if (result.hasCredits) {
        return {
          requestId: result.requestId,
          paymentStatus: 'success'
        };
      } else {
        // 5. If user needs to pay, create a Stripe session
        try {
          const session = await stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            mode: 'payment',
            line_items: [
              {
                price: stripePriceId.value(),
                quantity: 1,
              },
            ],
            success_url: `${frontendBaseUrl.value()}/loading?request_id=${result.requestId}`,
            cancel_url: `${frontendBaseUrl.value()}/generate`,
            metadata: {
              userId: auth.uid,
              generationRequestId: result.requestId,
              credits: '1'
            },
          });

          // Update the generation request with the session ID
          await db.collection(COLLECTIONS.GENERATION_REQUESTS)
            .doc(result.requestId)
            .update({
              paymentSessionId: session.id,
              updatedAt: FieldValue.serverTimestamp()
            });

          return {
            requestId: result.requestId,
            paymentStatus: 'pending',
            checkoutUrl: session.url
          };
        } catch (error) {
          console.error('Stripe session creation error:', error);
          // If Stripe fails, mark the request as failed
          await db.collection(COLLECTIONS.GENERATION_REQUESTS)
            .doc(result.requestId)
            .update({
              paymentStatus: 'failed',
              error: 'Failed to create payment session',
              updatedAt: FieldValue.serverTimestamp()
            });
          throw new HttpsError('internal', 'Failed to create payment session');
        }
      }
    } catch (error) {
      console.error('Error in createGenerationRequest:', error);
      if (error instanceof HttpsError) {
        throw error;
      }
      throw new HttpsError('internal', 'Failed to create generation request');
    }
  }
);