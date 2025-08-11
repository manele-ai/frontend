import { DocumentSnapshot } from "firebase-admin/firestore";
import { HttpsError, onCall } from "firebase-functions/v2/https";
import { db, REGION } from "../config";
import { Database } from "../types";

export const updateUserProfile = onCall({ 
  region: REGION,
  enforceAppCheck: true,
  consumeAppCheckToken: true,
}, async (request) => {
  const { displayName, photoURL } = request.data;

  // Validate that at least one field is present
  if (!displayName && !photoURL) {
    throw new HttpsError('invalid-argument', 'At least one field (displayName or photoURL) must be provided');
  }

  if (!request.auth?.uid) {
    throw new HttpsError('unauthenticated', 'User not authenticated');
  }

  const userRef = db.collection('users').doc(request.auth.uid);
  const userDoc = await userRef.get() as DocumentSnapshot<Database.User>;
  
  if (!userDoc.exists) {
    throw new HttpsError('not-found', 'User not found');
  }

  // Only update fields that are provided
  const updateData: Partial<Pick<Database.User, 'displayName' | 'photoURL'>> = {};
  if (displayName) updateData.displayName = displayName;
  if (photoURL) updateData.photoURL = photoURL;

  await userRef.update(updateData);

  // Get fresh data after update
  const updatedDoc = await userRef.get() as DocumentSnapshot<Database.User>;
  const userData = updatedDoc.data()!;

  return {
    displayName: userData.displayName,
    photoURL: userData.photoURL
  };
});