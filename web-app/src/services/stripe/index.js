import { loadStripe } from "@stripe/stripe-js";

const STRIPE_PUBLISHABLE_KEY = process.env.REACT_APP_STRIPE_PUBLISHABLE_KEY;
console.log("STRIPE_PUBLISHABLE_KEY", STRIPE_PUBLISHABLE_KEY);

let stripePromise = null;

export const getStripe = () => {
  if (!stripePromise) stripePromise = loadStripe(STRIPE_PUBLISHABLE_KEY);
  return stripePromise;
};