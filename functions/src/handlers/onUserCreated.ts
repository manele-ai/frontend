import admin from "firebase-admin";
import * as functions from "firebase-functions/v2";
import { beforeUserCreated } from "firebase-functions/v2/identity";
import { COLLECTIONS } from "../constants/collections";
import { Database } from "../types";

/**
 * Cloud Function that triggers when a new user is created in Firebase Auth.
 * It creates a corresponding document in the users collection with the same ID.
 */
export const onUserCreatedHandler = beforeUserCreated(async (event) => {
  if (!event.data) {
    throw new functions.https.HttpsError(
      'invalid-argument',
      'No user data provided'
    );
  }

  try {
    const userRef = admin.firestore().collection(COLLECTIONS.USERS).doc(event.data.uid);
    
    const userData: Database.User = {
      uid: event.data.uid,
      email: event.data.email || '',
      displayName: event.data.displayName || "",
      photoURL: event.data.photoURL || "",
      createdAt: admin.firestore.FieldValue.serverTimestamp() as admin.firestore.Timestamp,
      updatedAt: admin.firestore.FieldValue.serverTimestamp() as admin.firestore.Timestamp,
      songIds: [],
      taskIds: [],
      numSongsGenerated: 0,
      numDedicationsGiven: 0,
      sumDonationsTotal: 0,
      preferences: {
        favoriteStyles: [],
        language: 'ro'
      }
    };

    await userRef.set(userData);
    console.info(`Created Firestore document for new user ${event.data.uid}`);
    
    // We must return the event.data object to allow the user creation to proceed
    return event.data;
    
  } catch (error) {
    console.error(`Error creating Firestore document for user ${event.data.uid}:`, error);
    throw new functions.https.HttpsError(
      'internal',
      'Failed to create user document in Firestore'
    );
  }
}); 