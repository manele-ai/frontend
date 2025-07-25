import { Request, Response } from "express";
import { FieldValue } from "firebase-admin/firestore";
import { onRequest } from "firebase-functions/v2/https";
import Stripe from 'stripe';
import { db, REGION, stripeSecretKey } from "../config";
import { COLLECTIONS } from "../constants/collections";
import { Database } from "../types";

const stripe = new Stripe(stripeSecretKey.value(), {} as any);

export const stripeWebhook = onRequest({ region: REGION }, async (req: Request, res: Response) => {
  const sig = req.headers['stripe-signature'] as string | undefined;
  const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!endpointSecret) {
    console.error('Missing STRIPE_WEBHOOK_SECRET env variable');
    res.status(500).send('Webhook secret not configured');
    return;
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent((req as any).rawBody, sig!, endpointSecret);
  } catch (err) {
    console.error('⚠️  Webhook signature verification failed.', err);
    res.status(400).send(`Webhook Error: ${(err as Error).message}`);
    return;
  }

  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object as Stripe.Checkout.Session;

      const generationRequestId = session.metadata?.generationRequestId;
      if (!generationRequestId) {
        console.error('Missing generationRequestId in session metadata');
        break;
      }

      await db.runTransaction(async (tx) => {
        const requestRef = db.collection(COLLECTIONS.GENERATION_REQUESTS).doc(generationRequestId);
        const doc = await tx.get(requestRef);
        if (!doc.exists) {
          console.error('Generation request not found for id:', generationRequestId);
          return;
        }

        const data = doc.data() as Database.GenerationRequest;

        // ---- Ownership check ----
        const requestUserId = data.userId;
        const metadataUserId = session.metadata?.userId;

        // Prefer metadata check (added when session is created) but if we also have session.customer_email we can use that as secondary.
        if (metadataUserId && metadataUserId !== requestUserId) {
          console.error('UserId mismatch in Stripe webhook', { requestUserId, metadataUserId, generationRequestId });
          return; // Do NOT mark success – potential tampering
        }

        // ---- Idempotency check ----
        if (data.paymentStatus === 'success') {
          // Already processed – skip duplicate event
          return;
        }

        tx.update(requestRef, {
          paymentStatus: 'success',
          updatedAt: FieldValue.serverTimestamp(),
        });
      });
      break;
    }
    case 'payment_intent.payment_failed':
    case 'checkout.session.expired':
    case 'checkout.session.async_payment_failed': {
      const session = event.data.object as Stripe.Checkout.Session;
      const generationRequestId = session.metadata?.generationRequestId;
      if (!generationRequestId) {
        break;
      }

      await db.runTransaction(async (tx) => {
        const requestRef = db.collection(COLLECTIONS.GENERATION_REQUESTS).doc(generationRequestId);
        const doc = await tx.get(requestRef);
        if (!doc.exists) return;

        const data = doc.data() as Database.GenerationRequest;

        // Skip if already failed/success
        if (['failed', 'success'].includes(data.paymentStatus)) {
          return;
        }

        tx.update(requestRef, {
          paymentStatus: 'failed',
          updatedAt: FieldValue.serverTimestamp(),
        });
      });
      break;
    }
    default:
      break;
  }

  res.status(200).json({ received: true });
}); 