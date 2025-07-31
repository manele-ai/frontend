import { logger } from "firebase-functions/v2";
import { onDocumentWritten } from "firebase-functions/v2/firestore";
import { HttpsError } from "firebase-functions/v2/https";
import { COLLECTIONS } from "../../../constants/collections";
import { Database } from "../../../types";
import { enqueueDownloadSongTask } from "../../tasks/downloadSong";

export const onSongAudioUrlCreated = onDocumentWritten(
  `${COLLECTIONS.SONGS}/{songId}`,
  async (event) => {
    if (!event.data) return; // Song deleted, do nothing 
    const songId = event.params.songId;

    const before = event.data.before.data() as Database.SongData | undefined;
    const after = event.data.after.data() as Database.SongData | undefined;

    // Check if audioUrl was added (wasn't there before but is there now)
    if (!before?.apiData.audioUrl && after?.apiData.audioUrl) {
      try {
        await enqueueDownloadSongTask(songId, {
          scheduleDelaySeconds: 0, // Start immediately
        });
      } catch (error: any) {
        if (error.code === "functions/task-already-exists") {
          logger.info(`downloadSongTask for ${songId} already enqueued, skipping.`);
        } else {
          logger.error("Error in enqueueDownloadSongTask:", error);
          throw new HttpsError('internal', 'Internal server error while enqueuing download song task.');
        }
      }
    }
  }
);