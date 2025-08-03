import Stripe from 'stripe';
import {
  frontendBaseUrl,
  stripe,
  STRIPE_COUPON_ID_SUBSCRIBED_SONG,
  STRIPE_PRICE_ID_DEDICATION,
  STRIPE_PRICE_ID_SONG,
  STRIPE_PRICE_ID_SUBSCRIPTION,
} from "../../config";

export const createSongCheckoutSession = async ({
    userId,
    customerId,
    requestId,
    shouldPayDedication,
    aruncaCuBaniAmountToPay,
    applySubscriptionDiscount,
}: {
    userId: string;
    customerId: string;
    requestId: string;
    shouldPayDedication: boolean;
    aruncaCuBaniAmountToPay: number;
    applySubscriptionDiscount: boolean;
}) => {
    if (!stripe) {
      throw new Error('Stripe not initialized');
    }
    const line_items: Stripe.Checkout.SessionCreateParams.LineItem[] = [
      {
          price: STRIPE_PRICE_ID_SONG.value(),
          quantity: 1,
      },
    ];

    if (shouldPayDedication) {
      line_items.push({
          price: STRIPE_PRICE_ID_DEDICATION.value(),
          quantity: 1,
      });
    }

    if (aruncaCuBaniAmountToPay > 0) {
      line_items.push({
        price_data: {
          currency: 'RON',
          product_data: { name: `Arunca cu bani - ${aruncaCuBaniAmountToPay} RON` },
          unit_amount: aruncaCuBaniAmountToPay * 100,
        },
        quantity: 1,
      });
    }
    
    return await stripe.checkout.sessions.create({
        customer: customerId,
        payment_method_types: ['card'],
        mode: 'payment',
        line_items,
        allow_promotion_codes: true,
        discounts: applySubscriptionDiscount ? [{
            coupon: STRIPE_COUPON_ID_SUBSCRIBED_SONG.value(),
        }] : [],
        success_url: `${frontendBaseUrl.value()}/result?request_id=${requestId}`,
        // TODO: add cancel url
        cancel_url: `${frontendBaseUrl.value()}/generate`,
        metadata: {
          userId: userId,
          generationRequestId: requestId,
        },
      });
}

export const createSubCheckoutSession = async (
    userId: string,
    customerId: string,
) => {
    if (!stripe) {
        throw new Error('Stripe not initialized');
    }
    return await stripe.checkout.sessions.create({
        customer: customerId,
        payment_method_types: ['card'],
        mode: 'subscription',
        line_items: [
          {
            price: STRIPE_PRICE_ID_SUBSCRIPTION.value(),
            quantity: 1,
          },
        ],
        success_url: `${frontendBaseUrl.value()}/profile`,
        // TODO: add cancel url
        cancel_url: `${frontendBaseUrl.value()}`,
        subscription_data: {
          metadata: {
            userId: userId,
          },
        },
        metadata: {
          userId: userId,
        },
      });
}