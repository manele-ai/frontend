import { FieldValue } from "firebase-admin/firestore";
import { logger } from "firebase-functions/v2";
import { HttpsError, onCall } from "firebase-functions/v2/https";
import { db } from "../config";
import { COLLECTIONS } from "../constants/collections";
import { Database } from "../types";

/**
 * Callable function that creates a user document in Firestore if it doesn't already exist.
 * This is called by the client when they detect no user document exists for their uid.
 */
export const createUserIfNotExists = onCall(async (request) => {
  // Ensure user is authenticated
  if (!request.auth) {
    throw new HttpsError(
      'unauthenticated',
      'The function must be called while authenticated.'
    );
  }

  const { uid } = request.auth;
  const { displayName = "", photoURL = "" } = request.data || {};

  try {
    // Check if user document already exists
    const userRef = db.collection(COLLECTIONS.USERS).doc(uid);
    const userDoc = await userRef.get();

    // If user document already exists, return early
    if (userDoc.exists) {
      return { existed: true };
    }

    // Create new user document
    const userData: Database.User = {
      uid,
      displayName,
      photoURL,
      createdAt: FieldValue.serverTimestamp() as any,
      updatedAt: FieldValue.serverTimestamp() as any,
      stats: {
        numSongsGenerated: 0,
        numDedicationsGiven: 0,
        sumDonationsTotal: 0,
      },
    };

    const userPublicData: Database.UserPublic = {
      uid,
      displayName,
      photoURL,
      createdAt: FieldValue.serverTimestamp() as any,
      stats: {
        numSongsGenerated: 0,
        numDedicationsGiven: 0,
        sumDonationsTotal: 0,
      },
    };

    const batch = db.batch();
    batch.set(userRef, userData);
    batch.set(db.collection(COLLECTIONS.PUBLIC_USERS).doc(uid), userPublicData);
    await batch.commit();
    logger.info(`Created Firestore document for user ${uid}`);

    return { existed: false, user: userPublicData };
  } catch (error) {
    logger.error(`Error handling user document creation for ${uid}:`, error);
    throw new HttpsError(
      'internal',
      'Failed to handle user document creation'
    );
  }
}); 