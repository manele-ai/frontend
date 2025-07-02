import * as functions from "firebase-functions/v2";
import { onDocumentWritten } from "firebase-functions/v2/firestore";
import { COLLECTIONS } from "../constants/collections";
import { Database } from "../types";

/**
 * Cloud Function that triggers when a user document is written (created/updated) in the users collection.
 * It creates/updates a corresponding document in the publicUsers collection with public user data.
 */
export const onUserUpdatedHandler = onDocumentWritten(
  `${COLLECTIONS.USERS}/{userId}`,
  async (event) => {
    const userId = event.params.userId;
    const afterData = event.data?.after.data() as Database.User | undefined;
    
    try {
      // If user document was deleted, delete the corresponding public user document
      if (!afterData) {
        await event.data?.after.ref.firestore
          .collection(COLLECTIONS.PUBLIC_USERS)
          .doc(userId)
          .delete();
        
        console.info(`Deleted public user document for user ${userId}`);
        return;
      }

      // Create/update public user document with only the public fields
      const publicUserData: Database.PublicUser = {
        uid: afterData.uid,
        displayName: afterData.displayName || 'Anonymous User',
        photoURL: afterData.photoURL,
        numSongsGenerated: afterData.numSongsGenerated || 0,
        numDedicationsGiven: afterData.numDedicationsGiven || 0,
        sumDonationsTotal: afterData.sumDonationsTotal || 0
      };

      await event.data?.after.ref.firestore
        .collection(COLLECTIONS.PUBLIC_USERS)
        .doc(userId)
        .set(publicUserData);

      console.info(`Successfully synced public user data for user ${userId}`);
      
    } catch (error) {
      console.error(`Error in onUserUpdated for user ${userId}:`, error);
      throw new functions.https.HttpsError(
        'internal',
        'Failed to sync public user data'
      );
    }
  }); 