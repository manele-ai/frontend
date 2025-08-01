import admin from "firebase-admin";
import { FieldValue } from "firebase-admin/firestore";
import * as functions from "firebase-functions/v1";
import { COLLECTIONS } from "../../../constants/collections";
import { Database } from "../../../types";

/**
 * Cloud Function that triggers when a new user is created in Firebase Auth.
 * It creates a corresponding document in the users collection with the same ID.
 */
export const onAuthUserCreated = functions.auth.user().onCreate(async (user) => {
  if (!user) {
    throw new functions.https.HttpsError(
      'invalid-argument',
      'No user data provided'
    );
  }

  try {
    const userRef = admin.firestore().collection(COLLECTIONS.USERS).doc(user.uid);
    
    const userData: Database.User = {
      uid: user.uid,
      displayName: user.displayName || "",
      photoURL: user.photoURL || "",
      createdAt: FieldValue.serverTimestamp() as admin.firestore.Timestamp,
      updatedAt: FieldValue.serverTimestamp() as admin.firestore.Timestamp,
      stats: {
        numSongsGenerated: 0,
        numDedicationsGiven: 0,
        sumDonationsTotal: 0,
      },
    };

    await userRef.set(userData);
    functions.logger.info(`Created Firestore document for new user ${user.uid}`);
  } catch (error) {
    functions.logger.error(`Error creating Firestore document for user ${user.uid}:`, error);
    throw new functions.https.HttpsError(
      'internal',
      'Failed to create user document in Firestore'
    );
  }
}); 