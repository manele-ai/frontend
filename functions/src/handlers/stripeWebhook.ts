import { Request, Response } from "express";
import { logger } from "firebase-functions/v2";
import { HttpsError, onRequest } from "firebase-functions/v2/https";
import Stripe from 'stripe';
import { REGION, stripe, STRIPE_WEBHOOK_SECRET } from "../config";
import { processEvent } from "../service/payment/webhook";



export const stripeWebhook = onRequest({ region: REGION }, async (req: Request, res: Response) => {
  if (!stripe) {
    throw new HttpsError('internal', 'Stripe not initialized');
  }

  const sig = req.headers['stripe-signature'] as string | undefined;
  if (typeof sig !== 'string') {
    logger.error('[STRIPE HOOK] Missing stripe-signature header');
    res.status(400).send();
    return;
  }

  const webhookSecret = STRIPE_WEBHOOK_SECRET.value();

  if (!webhookSecret) {
    logger.error('[STRIPE HOOK] Missing STRIPE_WEBHOOK_SECRET env variable');
    res.status(500).send();
    return;
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent((req as any).rawBody, sig!, webhookSecret);
  } catch (err) {
    logger.error('[STRIPE HOOK] Webhook signature verification failed.', err);
    res.status(400).send();
    return;
  }
  try {
    await processEvent(event);
  } catch (err) {
    logger.error('[STRIPE HOOK] Error processing event.', err);
  }

  res.status(200).json({ received: true });
}); 