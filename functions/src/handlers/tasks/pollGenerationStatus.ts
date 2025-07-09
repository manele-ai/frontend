import * as admin from "firebase-admin";
import { getFunctions, TaskOptions } from "firebase-admin/functions";
import { logger } from "firebase-functions";
import { onTaskDispatched } from "firebase-functions/tasks";
import { HttpsError } from "firebase-functions/v2/https";
import { getTaskStatus } from "../../api/music-api";
import { db } from "../../config";
import { COLLECTIONS } from "../../constants/collections";
import { Database } from "../../types";
import { FAILURE_STATUSES, hasAdvanced, SUCCESS_STATUSES } from "../utils/status";

/**
 * Maps the external API's TaskStatus to our internal GenerationStatus
 * and provides appropriate error messages for failure states.
 */
// function mapExternalStatus(externalStatus: MusicApi.TaskStatus): {
//   status: Shared.GenerationStatus;
//   errorMessage?: string;
// } {
//   // Success case
//   if (externalStatus === "SUCCESS" || externalStatus === "FIRST_SUCCESS") {
//     return { status: "completed" };
//   }

//   // Failure cases
//   const failureStates: MusicApi.TaskStatus[] = [
//     "CREATE_TASK_FAILED",
//     "GENERATE_AUDIO_FAILED",
//     "CALLBACK_EXCEPTION",
//     "SENSITIVE_WORD_ERROR"
//   ];

//   if (failureStates.includes(externalStatus)) {
//     return {
//       status: "failed",
//       errorMessage: `Task failed with status: ${externalStatus}`
//     };
//   }

//   // Processing cases (PENDING, TEXT_SUCCESS, FIRST_SUCCESS)
//   return { status: "processing" };
// }

/**
 * Recursively removes keys with `undefined` values.
 *   • Leaves 0, false, null, '' intact (they’re valid Firestore values)
 *   • Handles nested objects/arrays
 */
function dropUndefined<T>(input: T): T {
  if (Array.isArray(input)) {
    return input.map(dropUndefined) as unknown as T;
  }
  if (input && typeof input === "object") {
    return Object.fromEntries(
      Object.entries(input)
            .filter(([, v]) => v !== undefined)
            .map(([k, v]) => [k, dropUndefined(v)])
    ) as T;
  }
  return input;
}

export const pollGenerationStatusTask = onTaskDispatched({
    retryConfig: {                    // exponential back-off up to ~10 min
      maxAttempts: 10,                 // try 8× before the task is dead-lettered
      maxRetrySeconds: 6*60,
      minBackoffSeconds: 5,
      maxBackoffSeconds: 10,
      maxDoublings: 1,
    },
    rateLimits: { 
      maxConcurrentDispatches: 20,
      maxDispatchesPerSecond: 10,
    },  // stay under API rate limits
  },
  async (req) => {
    const { taskId } = req.data || {};
    if (!taskId) {
      logger.error("Missing taskId in task payload");
      throw new HttpsError("invalid-argument", "Payload must include generationId and apiJobId");
    }

    const taskRef = db.collection(COLLECTIONS.GENERATE_SONG_TASKS).doc(taskId);
    const taskDoc = await taskRef.get();
    if (!taskDoc.exists) {
      throw new HttpsError('not-found', `No generation request found for task ID: ${taskId}`);
    }
    const { 
      status: currStatus,
      externalStatus: currExternalStatus,
      externalId: externalTaskId,
      userId,
      userGenerationInput,
     } = taskDoc.data() as Database.GenerateSongTask;

    // Check db status first
    if (currStatus !== "processing") {
      return;
    } 
    const { data } = await getTaskStatus(externalTaskId);
    const { status: latestExternalStatus, response } = data;

    // const { status, errorMessage } = mapExternalStatus(statusResponse.data.status);
    // Check if status has advanced
    if (!hasAdvanced(currExternalStatus, latestExternalStatus)) {
      throw new HttpsError('unavailable', `Status has not advanced from ${currExternalStatus} to ${latestExternalStatus}`);
    }

    if (latestExternalStatus in FAILURE_STATUSES) {
      return;
    }

    if (SUCCESS_STATUSES.includes(latestExternalStatus) && response.sunoData) {
      const songApiData = response.sunoData[0];
      const filteredSongApiData = dropUndefined(songApiData);
      const existingSongQuery = await db.collection(COLLECTIONS.SONGS)
        .where('externalId', '==', songApiData.id)
        .limit(1)
        .get();

      if (!existingSongQuery.empty) {
        // Song already exists in db, update with new data
        const existingSongDoc = existingSongQuery.docs[0];
        await existingSongDoc.ref.update({
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
          apiData: filteredSongApiData, // Overwrite entire map with new data
        });
      } else {
        // First time creating this song in db
        const dbSongData: Database.SongData = {
          externalId: songApiData.id,
          taskId,
          externalTaskId,
          userId,
          createdAt: admin.firestore.FieldValue.serverTimestamp() as admin.firestore.Timestamp,
          updatedAt: admin.firestore.FieldValue.serverTimestamp() as admin.firestore.Timestamp,
          userGenerationInput,
          apiData: filteredSongApiData,
        }
        // Add song to database
        await db.collection(COLLECTIONS.SONGS).add(dbSongData);
      }
      return;
    }
    throw new HttpsError('internal', `Unexpected status: ${latestExternalStatus}`);
  }
);

export async function enqueuePollGenerationStatusTask(
  taskId: string,
  options: TaskOptions,
) {
  const queue = getFunctions().taskQueue(`locations/${location}/functions/${pollGenerationStatusTask.name}`);
  const id = [...`pollGenerationStatus-${taskId}`].reverse().join("");
  return queue.enqueue({ taskId }, {
    ...options,
    id, // Ensure non-duplicate tasks
  });
}