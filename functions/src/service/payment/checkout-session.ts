import { frontendBaseUrl, stripe, STRIPE_PRICE_ID_SUBSCRIPTION } from "../../config";

export const createOneTimeCheckoutSession = async (
    userId: string,
    customerId: string,
    requestId: string,
    priceId: string,
) => {
    if (!stripe) {
        throw new Error('Stripe not initialized');
    }
    return await stripe.checkout.sessions.create({
        customer: customerId,
        payment_method_types: ['card'],
        mode: 'payment',
        line_items: [
          {
            price: priceId,
            quantity: 1,
          },
        ],
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