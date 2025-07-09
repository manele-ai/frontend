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
    const afterData = event.data?.after.data() as Database.SongData;
    if (!afterData) return; // Do nothing if song deleted

    const songId = event.params.songId;
    try {
      // Create/update public song document with only the public fields
      const publicSongData: Database.SongDataPublic = {
        externalAudioUrl: afterData.apiData.audioUrl || "",
        storage: afterData.storage || null,
        userGenerationInput: {
          title: afterData.userGenerationInput.title,
          from: afterData.userGenerationInput.from,
          to: afterData.userGenerationInput.to,
          dedication: afterData.userGenerationInput.dedication,
          wantsDedication: afterData.userGenerationInput.wantsDedication,
          wantsDonation: afterData.userGenerationInput.wantsDonation,
          donationAmount: afterData.userGenerationInput.donationAmount,
          style: afterData.userGenerationInput.style,
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