import * as functions from "firebase-functions/v2";
import { onDocumentWritten } from "firebase-functions/v2/firestore";
import { COLLECTIONS } from "../constants/collections";
import { Database } from "../types";

/**
 * Cloud Function that triggers when a song document is written (created/updated) in the songs collection.
 * It creates/updates a corresponding document in the mirrored collection with public song data.
 */
export const mirrorSongsPublicHandler = onDocumentWritten(
  `${COLLECTIONS.SONGS}/{songId}`,
  async (event) => {
    const songId = event.params.songId;
    const afterData = event.data?.after.data() as Database.SongData;
    
    try {
      // Create/update public song document with only the public fields
      const publicSongData: Database.SongDataPublic = {
        audioUrl: afterData.audioUrl,
        metadata: {
          title: afterData.metadata.title,
          from: afterData.metadata.from,
          to: afterData.metadata.to,
          dedication: afterData.metadata.dedication,
          wantsDedication: afterData.metadata.wantsDedication,
          wantsDonation: afterData.metadata.wantsDonation,
          donationAmount: afterData.metadata.donationAmount,
        }
      };

      await event.data?.after.ref.firestore
        .collection(COLLECTIONS.PUBLIC_SONGS)
        .doc(songId)
        .set(publicSongData);

      console.info(`Successfully synced public song data for song ${songId}`);
      
    } catch (error) {
      console.error(`Error in onSongUpdated for song ${songId}:`, error);
      throw new functions.https.HttpsError(
        'internal',
        'Failed to sync public song data'
      );
    }
  }); 