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
  if (!request.auth) {
    throw new HttpsError(
      'unauthenticated',
      'The function must be called while authenticated.'
    );
  }

  const { uid } = request.auth;
  const { displayName = "", photoURL = "" } = request.data || {};

  try {
    return await db.runTransaction(async (tx) => {
      const userRef = db.collection(COLLECTIONS.USERS).doc(uid);
      const publicRef = db.collection(COLLECTIONS.PUBLIC_USERS).doc(uid);

      // Read both documents in transaction
      const [userDoc, publicDoc] = await Promise.all([
        tx.get(userRef),
        tx.get(publicRef)
      ]);

      // Check for data inconsistency
      if (userDoc.exists !== publicDoc.exists) {
        logger.error(`Data inconsistency for user ${uid}: users=${userDoc.exists}, public=${publicDoc.exists}`);
        throw new HttpsError(
          'failed-precondition',
          'Inconsistent user data state detected'
        );
      }

      // If both docs exist, return early
      if (userDoc.exists) {
        return { existed: true, profile: publicDoc.data() };
      }

      // Create new user documents
      const now = FieldValue.serverTimestamp() as any;
      const userData: Database.User = {
        uid,
        displayName,
        photoURL,
        createdAt: now,
        updatedAt: now,
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
        createdAt: now,
        stats: {
          numSongsGenerated: 0,
          numDedicationsGiven: 0,
          sumDonationsTotal: 0,
        },
      };

      // Write both docs atomically within transaction
      tx.set(userRef, userData);
      tx.set(publicRef, userPublicData);

      logger.info(`Created Firestore documents for user ${uid}`);
      return { existed: false, profile: userPublicData };
    });

  } catch (error) {
    logger.error(`Error handling user document creation for ${uid}:`, error);
    // Preserve the original error code if it's an HttpsError
    if (error instanceof HttpsError) {
      throw error;
    }
    throw new HttpsError(
      'internal',
      'Failed to handle user document creation'
    );
  }
}); 