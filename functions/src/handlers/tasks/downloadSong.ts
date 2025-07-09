import { FieldValue } from "firebase-admin/firestore";
import { getFunctions, TaskOptions } from "firebase-admin/functions";
import { logger } from "firebase-functions";
import { onTaskDispatched } from "firebase-functions/tasks";
import { HttpsError } from "firebase-functions/v2/https";
import { pipeline } from "node:stream/promises";
import { db, REGION, songsBucket } from "../../config";
import { COLLECTIONS } from "../../constants/collections";

// 10MB in bytes - maximum allowed file size
// const MAX_FILE_SIZE = 10 * 1024 * 1024;
export const getAudioFileSize = async (audioUrl: string): Promise<number> => {
    const response = await fetch(audioUrl, { method: 'HEAD' });
    const contentLength = parseInt(response.headers.get('content-length') || '0', 10);
    return contentLength;
}

/**
 * Cloud Task that downloads an audio file from `audioUrl` and uploads it to
 * the project's Firebase Storage bucket. Optimized for small files (< 10MB).
 * Updates the corresponding `songs/{songId}` document with the Storage path
 * so the operation is idempotent (if the field is already set, task completes early).
 */
export const downloadSongTask = onTaskDispatched(
  {
    retryConfig: {
      maxAttempts: 5,
      minBackoffSeconds: 30,
      maxBackoffSeconds: 300,
      maxDoublings: 2,
    },
    rateLimits: { maxConcurrentDispatches: 10 }, // Can handle more concurrent small files
    memory: "256MiB",
  },
  async (req) => {
    const { songId } = req.data || {};

    if (!songId) {
      logger.error("downloadSong: Missing songId", { songId });
      return;
    }

    // Check whether the file has already been stored
    const songDocRef = db.collection(COLLECTIONS.SONGS).doc(songId);
    const songSnap = await songDocRef.get();
    if (!songSnap.exists) {
        logger.error("downloadSong: Song not found", { songId });
        return;
    }
    const { storage } = songSnap.data() || {};
    if (storage && storage.url) {
        // File already uploaded – nothing to do.
        logger.info(`downloadSong: File already downloaded for songId ${songId}`);
        return;
    }
    const { audioUrl } = songSnap.data() || {};
    if (!audioUrl) {
        logger.error("downloadSong: Missing audioUrl", { songId });
        return;
    }
    const fileName = `${songId}.mp3`;
    const destination = `songs/${fileName}`;
    const file = songsBucket.file(destination);
    logger.info(`downloadSong: Starting download ${audioUrl} → gs://${songsBucket.name}/${destination}`);

    // Now fetch the actual file
    const downloadResponse = await fetch(audioUrl);
    if (!downloadResponse.ok || !downloadResponse.body) {
      logger.error(`downloadSong: Failed to fetch ${audioUrl} – status ${downloadResponse.status}`);
      throw new HttpsError("unavailable", `Could not download audio: ${downloadResponse.statusText}`);
    }

    // Use pipeline to stream from the HTTP response into the Storage write stream
    await pipeline(
        downloadResponse.body as unknown as NodeJS.ReadableStream,
        file.createWriteStream({
            metadata: {
                contentType: downloadResponse.headers.get("content-type") || "audio/mpeg",
            },
        })
    );
    logger.info(`downloadSong: Uploaded song to gs://${songsBucket.name}/${destination}`);

    // Update the song document with the storage URL
    await songDocRef.update({
        updatedAt: FieldValue.serverTimestamp(),
        storage: {
            url: file.publicUrl(),
            path: destination,
            sizeBytes: file.metadata.size,
            contentType: file.metadata.contentType,
        },
    });
    return;
  }
);

export async function enqueueDownloadSongTask(
  songId: string,
  options: TaskOptions,
) {
  const queue = getFunctions().taskQueue(`locations/${REGION}/functions/downloadSongTask`);
  const id = [...`downloadSong-${songId}`].reverse().join("");
  return queue.enqueue({ songId }, {
      ...options,
      id, // Ensure non-duplicate tasks
    }
  );
}