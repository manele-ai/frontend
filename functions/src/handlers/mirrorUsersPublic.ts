import * as functions from "firebase-functions/v2";
import { onDocumentWritten } from "firebase-functions/v2/firestore";
import { COLLECTIONS } from "../constants/collections";
import { Database } from "../types";

/**
 * Cloud Function that triggers when a user document is written (created/updated/deleted) in the users collection.
 * It creates/updates/deletes a corresponding document in the mirrored collection with public user data.
 */
export const mirrorUsersPublic = onDocumentWritten(
  `${COLLECTIONS.USERS}/{userId}`,
  async (event) => {
    const userId = event.params.userId;
    const afterData = event.data?.after.data() as Database.User | undefined;
    
    try {
      // Handle deletion
      if (!afterData) {
        await event.data?.after.ref.firestore
          .collection(COLLECTIONS.PUBLIC_USERS)
          .doc(userId)
          .delete();
        
        console.info(`Successfully deleted public user data for user ${userId}`);
        return;
      }

      // Create/update public user document with only the public fields
      const publicUserData: Database.UserPublic = {
        uid: afterData.uid,
        displayName: afterData.displayName || 'Anonymous User',
        createdAt: afterData.createdAt,
        photoURL: afterData.photoURL,
        stats: {
          numSongsGenerated: afterData.stats.numSongsGenerated,
          numDedicationsGiven: afterData.stats.numDedicationsGiven,
          sumDonationsTotal: afterData.stats.sumDonationsTotal,
        }
      };

      await event.data?.after.ref.firestore
        .collection(COLLECTIONS.PUBLIC_USERS)
        .doc(userId)
        .set(publicUserData);

      console.info(`Successfully synced public user data for user ${userId}`);
      
    } catch (error) {
      console.error(`Error in mirrorUsersPublic for user ${userId}:`, error);
      throw new functions.https.HttpsError(
        'internal',
        'Failed to sync public user data'
      );
    }
  }); 