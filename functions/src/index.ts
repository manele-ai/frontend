import admin from "firebase-admin";
import * as functions from "firebase-functions";
import { setGlobalOptions } from "firebase-functions/v2";
import { REGION } from "./config";

setGlobalOptions({
  region: REGION,
});

// Initialize Firebase Admin SDK
// This will be done once per function instance.
// Ensure your GOOGLE_APPLICATION_CREDENTIALS environment variable is set
// when running locally outside of Firebase emulators, or that emulators are running.
if (admin.apps.length === 0) {
  admin.initializeApp();
}

functions.logger.info("Firebase Admin SDK initialized.");

// Import and export handlers
import { generateSongHandler } from "./handlers/generateSong"; // done 
import { mirrorSongsPublicHandler } from './handlers/mirrorSongsPublic';
import { mirrorUsersPublicHandler } from './handlers/mirrorUsersPublic';
import { onAuthUserCreatedHandler } from './handlers/onAuthUserCreated';
import { onSongCreatedHandler } from './handlers/onSongCreated';

// Export functions to be deployed
export const generateSong = generateSongHandler;
export const onAuthUserCreated = onAuthUserCreatedHandler;
export const onSongCreated = onSongCreatedHandler;
export const mirrorUsersPublic = mirrorUsersPublicHandler;
export const mirrorSongsPublic = mirrorSongsPublicHandler;

// Export tasks
export { downloadSongTask } from "./handlers/tasks/downloadSong";
export { pollGenerationStatusTask } from "./handlers/tasks/pollGenerationStatus";
