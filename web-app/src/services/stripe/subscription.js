import { createSubscriptionCheckoutSession } from "../firebase/functions";
import { getStripe } from "../stripe";

export const redirectToSubscriptionCheckout = async () => {
    const { sessionId } = await createSubscriptionCheckoutSession();
    if (sessionId) {
      const stripe = await getStripe();
      const { error } = await stripe.redirectToCheckout({ sessionId });
      if (error) {
        console.error('A apărut o eroare la plata. Încearcă din nou.');
      }
    } else {
      console.error('Failed to create subscription checkout session');
    }
};