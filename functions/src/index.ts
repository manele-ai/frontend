import admin from "firebase-admin";
import * as functions from "firebase-functions";

// Initialize Firebase Admin SDK
// This will be done once per function instance.
// Ensure your GOOGLE_APPLICATION_CREDENTIALS environment variable is set
// when running locally outside of Firebase emulators, or that emulators are running.
if (admin.apps.length === 0) {
  admin.initializeApp();
}

functions.logger.info("Firebase Admin SDK initialized.");

// Import and export handlers
import { downloadSongHandler } from "./handlers/downloadSong"; // la final sa dowloanda piesa ( id pisea ) 
import { generateSongHandler } from "./handlers/generateSong"; // done 
import { getGenerationStatusHandler } from "./handlers/getGenerationStatus"; // pulling la 20 s ( id pisea primit)
import { mirrorSongsPublicHandler } from './handlers/mirrorSongsPublic';
import { mirrorUsersPublicHandler } from './handlers/mirrorUsersPublic';
import { onAuthUserCreatedHandler } from './handlers/onAuthUserCreated';
import { onSongCreatedHandler } from './handlers/onSongCreated';

// Export functions to be deployed
export const generateSong = generateSongHandler;
export const getGenerationStatus = getGenerationStatusHandler;
export const downloadSong = downloadSongHandler;
export const onAuthUserCreated = onAuthUserCreatedHandler;
export const onSongCreated = onSongCreatedHandler;
export const mirrorUsersPublic = mirrorUsersPublicHandler;
export const mirrorSongsPublic = mirrorSongsPublicHandler;

// Example of how to use defined parameters (config) if needed directly in index.ts
// import { thirdPartyApiBaseUrl } from "./config";
// functions.logger.info(`Third-party API Base URL: ${thirdPartyApiBaseUrl.value()}`);
