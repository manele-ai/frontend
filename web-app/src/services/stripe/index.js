import { loadStripe } from "@stripe/stripe-js";
import { createStripeCheckoutSession } from "services/firebase/functions";

const STRIPE_PUBLISHABLE_KEY = process.env.REACT_APP_STRIPE_PUBLISHABLE_KEY;

let stripePromise = null;
const getStripe = () => {
  if (!stripePromise) stripePromise = loadStripe(STRIPE_PUBLISHABLE_KEY);
  return stripePromise;
};

export async function startStripeCheckout({ credits }) {
    const { sessionId } = await createStripeCheckoutSession({ 
        credits,
    });
    const stripe = await getStripe();
    const { error } = await stripe.redirectToCheckout({ sessionId: sessionId });
    if (error) throw error;
}