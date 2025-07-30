import { FieldValue } from "firebase-admin/firestore";
import Stripe from "stripe";
import { db, stripe } from "../../config";
import { COLLECTIONS } from "../../constants/collections";
import { Database } from "../../types";
import { getUserByStripeCustomerId } from "./customer";

// We are using only Stripe Checkout Session and Stripe Subscription services.
const ALLOWED_EVENTS = [
    'checkout.session.completed',
    'checkout.session.expired',
    'customer.subscription.created',
    'customer.subscription.updated',
    'customer.subscription.deleted',
    'invoice.paid',
    'invoice.payment_failed',
    'invoice.payment_action_required',
    'invoice.upcoming',
    'invoice.marked_uncollectible',
    'invoice.payment_succeeded',
];
  
export const processEvent = async (event: Stripe.Event) => {
    if (!ALLOWED_EVENTS.includes(event.type)) {
        return;
    }

    if (isSubscriptionEvent(event)) {
        await processSubscriptionEvent(event);
        return;
    }

    // Onetime payments
    if (event.type === 'checkout.session.completed' && (event.data.object as Stripe.Checkout.Session).mode === 'payment') {
        await processOnetimeCheckoutSessionCompleted(event.data.object as Stripe.Checkout.Session);
    } else if (event.type === 'checkout.session.expired' && (event.data.object as Stripe.Checkout.Session).mode === 'payment') {
        await processOnetimeCheckoutSessionExpired(event.data.object as Stripe.Checkout.Session);
    } else {
        console.error(`[STRIPE HOOK][ERROR] Unhandled event type ${event.type}, event: ${JSON.stringify(event)}`);
    }
}

const isSubscriptionEvent = (event: Stripe.Event): boolean => {
    const eventType = event.type;
    const eventObject = event.data.object;
    // Direct subscription events
    if (eventType.startsWith('customer.subscription.')) {
        return true;
    }
    // Checkout session events
    if (eventType.includes('checkout.session')) {
        if ((eventObject as Stripe.Checkout.Session).mode === 'subscription') {
            return true;
        } else if ((eventObject as Stripe.Checkout.Session).mode === 'payment') {
            return false;
        }
    }
    // Invoice events with subscription field
    if (eventType.startsWith('invoice.') && (eventObject as Stripe.Invoice).subscription) {
        return true;
    }
    // Last check: subscription in relevant objects
    if ((eventObject as Stripe.Subscription).id || 
        (eventObject as Stripe.Invoice).subscription) {
        return true;
    }
    return false;
}

/**
 * Processes a successful one-time payment checkout session from Stripe.
 * Updates the generation request's payment status to 'success' which triggers the generation pipeline.
 * 
 * Key behaviors:
 * - Runs in a transaction to ensure atomicity
 * - Verifies request ownership by checking userId
 * - Prevents double-processing of payments
 * - Updates payment status which triggers generation pipeline
 * 
 * @param session - Stripe Checkout Session object for a completed payment
 * @throws {Error} If generationRequestId is missing from session metadata
 * @throws {Error} If generation request is not found
 * @throws {Error} If there's a userId mismatch between request and session
 * @throws {Error} If payment was already processed (status is 'failed' or 'success')
 */
const processOnetimeCheckoutSessionCompleted = async (session: Stripe.Checkout.Session) => {
    const generationRequestId = session.metadata?.generationRequestId;
    if (!generationRequestId) {
        throw new Error('[STRIPE HOOK][ERROR] Missing generationRequestId in session metadata');
    }
    await db.runTransaction(async (tx) => {
        const requestRef = db.collection(COLLECTIONS.GENERATION_REQUESTS).doc(generationRequestId);
        const doc = await tx.get(requestRef);
        if (!doc.exists) {
          throw new Error(`[STRIPE HOOK] Generation request not found for id: ${generationRequestId}`);
        }

        const data = doc.data() as Database.GenerationRequest;

        // Check ownership
        const requestUserId = data.userId;
        const metadataUserId = session.metadata?.userId;

        // Prefer metadata check (added when session is created) but if we also have session.customer_email we can use that as secondary.
        if (metadataUserId && metadataUserId !== requestUserId) {
          throw new Error(`[STRIPE HOOK][ERROR] UserId mismatch in Stripe webhook: ${requestUserId} !== ${metadataUserId} for generationRequestId: ${generationRequestId}`);
        }

        // Check if payment was already processed
        if (['failed', 'success'].includes(data.paymentStatus)) {
          throw new Error(`[STRIPE HOOK][ERROR] Already processed generationRequestId: ${generationRequestId}`);
        }

        tx.update(requestRef, {
          paymentStatus: 'success',
          updatedAt: FieldValue.serverTimestamp(),
        });
      });
}

/**
 * Processes an expired one-time payment checkout session from Stripe.
 * Updates the generation request's payment status to 'failed' to prevent further processing.
 * 
 * @param session - Stripe Checkout Session object for an expired payment
 * @throws {Error} If generationRequestId is missing from session metadata
 * @throws {Error} If generation request is not found
 * @throws {Error} If payment was already processed (status is 'failed' or 'success')
 */
const processOnetimeCheckoutSessionExpired = async (session: Stripe.Checkout.Session) => {
    const generationRequestId = session.metadata?.generationRequestId;
    if (!generationRequestId) {
        throw new Error('[STRIPE HOOK][ERROR] Missing generationRequestId in session metadata');
    }
    await db.runTransaction(async (tx) => {
        const requestRef = db.collection(COLLECTIONS.GENERATION_REQUESTS).doc(generationRequestId);
        const doc = await tx.get(requestRef);
        if (!doc.exists) {
            throw new Error(`[STRIPE HOOK][ERROR] Generation request not found for id: ${generationRequestId}`);
        }

        const data = doc.data() as Database.GenerationRequest;

        // Check if payment was already processed
        if (['failed', 'success'].includes(data.paymentStatus)) {
            throw new Error(`[STRIPE HOOK][ERROR] Already processed generationRequestId: ${generationRequestId}`);
        }

        tx.update(requestRef, {
          paymentStatus: 'failed',
          updatedAt: FieldValue.serverTimestamp(),
        });
      });
}


/**
 * Synchronizes subscription data from Stripe to Firestore for a given subscription event.
 * This function acts as a single source of truth for subscription state, ensuring Firestore
 * always reflects the current state in Stripe.
 * 
 * @param event - Stripe event object containing subscription-related data
 * @throws {Error} If Stripe is not initialized
 * @throws {Error} If customerId is missing from the session
 * @throws {Error} If userId is missing from session metadata
 */
const processSubscriptionEvent = async (event: Stripe.Event) => {
    if (!stripe) {
        throw new Error('Stripe not initialized');
    }
    const session = event.data.object as Stripe.Checkout.Session;
    const customerId = session.customer;
    if (!customerId || typeof customerId !== 'string') {
        throw new Error('[STRIPE HOOK][ERROR] Missing or invalid customerId in session');
    }

    const { id: userId } = await getUserByStripeCustomerId(customerId);

    // Fetch latest subscription data from Stripe, don't rely on webhooks only
    const subscriptions = await stripe.subscriptions.list({
        customer: customerId as string,
        limit: 1,
        status: "all",
        expand: ["data.default_payment_method"],
    });
    
    if (subscriptions.data.length === 0) {
        await db.collection(COLLECTIONS.USERS).doc(userId).update({
            subscription: { status: 'none' },
        });
        return;
    }

    const subscription = subscriptions.data[0];
    const subData = {
        stripeSubscriptionId: subscription.id,
        status: subscription.status,
        priceId: subscription.items.data[0].price.id,
        currentPeriodEnd: subscription.current_period_end,
        currentPeriodStart: subscription.current_period_start,
        cancelAtPeriodEnd: subscription.cancel_at_period_end,
        paymentMethod:
          subscription.default_payment_method &&
          typeof subscription.default_payment_method !== "string"
            ? {
                brand: subscription.default_payment_method.card?.brand ?? null,
                last4: subscription.default_payment_method.card?.last4 ?? null,
              }
            : null,
    };
    await db.collection(COLLECTIONS.USERS).doc(userId).update({
        subscription: subData,
    });
}