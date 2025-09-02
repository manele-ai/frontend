import { logger } from "firebase-functions/v2";
import { onDocumentWritten } from "firebase-functions/v2/firestore";
import { HttpsError } from "firebase-functions/v2/https";
import { isEqual } from "lodash";
import { COLLECTIONS } from "../../../constants/collections";
import { Database } from "../../../types";

/**
 * Extracts public fields from a song document according to SongDataPublic type
 */
function extractPublicFields(songData: Database.SongData): Database.SongDataPublic {
  // Ensure we have defaults for userGenerationInput
  const userInput = songData.userGenerationInput || {
    title: "Untitled",
    style: "Default",
    from: "",
    to: "",
    dedication: "",
    wantsDedication: false,
    wantsDonation: false,
    donationAmount: 0,
  };

  // Ensure we have defaults for apiData
  const apiData = songData.apiData || {
    audioUrl: "",
    streamAudioUrl: "",
    imageUrl: "",
    title: "",
    duration: 0,
  };

  return {
    taskId: songData.taskId,
    userId: songData.userId,
    requestId: songData.requestId,
    createdAt: songData.createdAt,
    updatedAt: songData.updatedAt,
    storage: songData.storage ? {
      url: songData.storage.url,
      sizeBytes: songData.storage.sizeBytes,
      contentType: songData.storage.contentType,
    } : null,
    userGenerationInput: {
      title: userInput.title || "Untitled",
      style: userInput.style || "Default",
      lyricsDetails: userInput.lyricsDetails,
      from: userInput.from || "",
      to: userInput.to || "",
      dedication: userInput.dedication || "",
      wantsDedication: userInput.wantsDedication || false,
      wantsDonation: userInput.wantsDonation || false,
      donorName: userInput.donorName || "",
      donationAmount: userInput.donationAmount || 0,
    },
    apiData: {
      audioUrl: apiData.audioUrl || "",
      streamAudioUrl: apiData.streamAudioUrl || "",
      imageUrl: apiData.imageUrl || "",
      title: apiData.title || "",
      duration: apiData.duration || 0,
    }
  };
}

/**
 * Cloud Function that triggers when a song document is written (created/updated/deleted) in the songs collection.
 * It maintains a corresponding public version in the public songs collection.
 */
export const mirrorSongsPublic = onDocumentWritten(
  `${COLLECTIONS.SONGS}/{songId}`,
  async (event) => {
    if (!event.data) {
      logger.warn('No event data available');
      return;
    }

    const songId = event.params.songId;
    const beforeData = event.data.before.data() as Database.SongData | undefined;
    const afterData = event.data.after.data() as Database.SongData | undefined;

    try {
      // Get reference to the public document
      const publicSongRef = event.data.after.ref.firestore
        .collection(COLLECTIONS.PUBLIC_SONGS)
        .doc(songId);

      // Handle deletion
      if (!afterData) {
        await publicSongRef.delete();
        return;
      }

      // Extract public fields from before/after data
      const beforePublicData = beforeData ? extractPublicFields(beforeData) : null;
      const afterPublicData = extractPublicFields(afterData);

      // If updating and no relevant fields changed, skip the write
      if (beforeData && isEqual(beforePublicData, afterPublicData)) {
        return;
      }

      // Create or update public document
      await publicSongRef.set(afterPublicData);

    } catch (error) {
      logger.error(`Error in mirrorSongsPublicHandler for song ${songId}:`, error);
      throw new HttpsError(
        'internal',
        'Failed to sync public song data'
      );
    }
  }); 