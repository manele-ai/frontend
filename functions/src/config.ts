import admin from "firebase-admin";
import { defineString } from "firebase-functions/params";
import { setGlobalOptions } from "firebase-functions/v2";

if (admin.apps.length === 0) {
  admin.initializeApp();
}

// Define parameters for environment variables
// These can be set in .env files for local emulation (e.g. .env.local, .env.<project_id>)
// or configured in Firebase console for deployed functions.
// See https://firebase.google.com/docs/functions/config-env

export const REGION = "europe-central2";

export const thirdPartyApiBaseUrl = defineString(
  "THIRD_PARTY_API_BASE_URL",
  {
    description: "Base URL for the third-party music generation API.",
    default: "https://api.examplemusic.com/api/v1", // Provide a sensible default or placeholder
  },
);

export const thirdPartyApiKey = defineString(
  "THIRD_PARTY_API_KEY",
  {
    description: "API key for the third-party music generation API.",
    // No default for sensitive keys, ensure it's set during deployment/emulation
  },
);

export const firebaseStorageBucket = defineString(
  "MP3_STORAGE_BUCKET",
  {
    description: "Firebase Storage bucket name (e.g., your-project-id.appspot.com).",
    // No default, should be specific to the Firebase project
  },
);

export const openaiApiKey = defineString(
  "OPENAI_API_KEY",
  {
    description: "API key for OpenAI API.",
    // No default for sensitive keys, ensure it's set during deployment/emulation
  },
);

export const stripeSecretKey = defineString(
  "STRIPE_SECRET_KEY",
  {
    description: "Secret API key for Stripe",
  },
);

export const stripePriceId = defineString(
  "STRIPE_PRICE_ID",
  {
    description: "Stripe Price ID for one credit purchase",
  },
);

export const frontendBaseUrl = defineString(
  "FRONTEND_BASE_URL",
  {
    description: "Base URL of the front-end (e.g. https://yourapp.com)",
    default: "http://localhost:3000",
  },
);

export const db = admin.firestore();
export const storage = admin.storage();
export const songsBucket = storage.bucket();

setGlobalOptions({
  region: REGION,
});