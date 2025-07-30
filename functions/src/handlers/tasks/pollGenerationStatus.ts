import { FieldValue } from "firebase-admin/firestore";
import { getFunctions, TaskOptions } from "firebase-admin/functions";
import { logger } from "firebase-functions";
import { onTaskDispatched } from "firebase-functions/tasks";
import { HttpsError } from "firebase-functions/v2/https";
import { getTaskStatus } from "../../api/music";
import { db, REGION } from "../../config";
import { COLLECTIONS } from "../../constants/collections";
import { handleGenerationFailed } from "../../service/generation/failure";
import { Database } from "../../types";
import { FAILURE_STATUSES, hasAdvanced, mapExternalStatus, SUCCESS_STATUSES } from "../utils/status";

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
      externalStatus: currExternalStatus,
      externalId: externalTaskId,
      userId,
      userGenerationInput,
      requestId,
     } = taskDoc.data() as Database.GenerateSongTask;

    // Check db status first
    if (["SUCCESS", ...FAILURE_STATUSES].includes(currExternalStatus)) {
      return; // No retry
    } 

    const { status: latestExternalStatus, response } = (await getTaskStatus(externalTaskId)).data;
    // Check if status has advanced
    if (!hasAdvanced(currExternalStatus, latestExternalStatus)) {
      // Retry later
      throw new HttpsError('unavailable', `Status has not advanced from ${currExternalStatus} to ${latestExternalStatus}`);
    }

    if (FAILURE_STATUSES.includes(latestExternalStatus)) {
      const batch = db.batch();
      batch.update(taskRef, {
        externalStatus: latestExternalStatus,
        updatedAt: FieldValue.serverTimestamp(),
      });
      const taskStatusRef = db.collection(COLLECTIONS.TASK_STATUSES).doc(taskId);
      batch.update(taskStatusRef, {
        status: "failed",
        updatedAt: FieldValue.serverTimestamp(),
      });
      await batch.commit();

      // Refund the credit to the user
      await handleGenerationFailed(userId, requestId, "Generation failed");
      return; // No retry
    }

    if (SUCCESS_STATUSES.includes(latestExternalStatus) && response.sunoData) {
      const songApiData = response.sunoData[0];
      const filteredSongApiData = dropUndefined(songApiData);
      // TODO: better check in task for songIds
      const existingSongQuery = await db.collection(COLLECTIONS.SONGS)
        .where('externalId', '==', songApiData.id)
        .limit(1)
        .get();

      const batch = db.batch();
      let songId: string;
      if (!existingSongQuery.empty) {
        // Song already exists in db, update with new data
        const existingSongDoc = existingSongQuery.docs[0];
        songId = existingSongDoc.id;
        batch.update(existingSongDoc.ref, {
          updatedAt: FieldValue.serverTimestamp(),
          apiData: filteredSongApiData, // Overwrite entire map with new data
        });
      } else {
        // First time creating this song in db
        const newSongRef = db.collection(COLLECTIONS.SONGS).doc();
        songId = newSongRef.id;
        batch.set(newSongRef, {
          externalId: songApiData.id,
          taskId,
          externalTaskId,
          userId,
          createdAt: FieldValue.serverTimestamp(),
          updatedAt: FieldValue.serverTimestamp(),
          userGenerationInput,
          apiData: filteredSongApiData,
        } as Database.SongData);
      }
      // Finally, update task and taskStatus to reflect success
      batch.update(taskRef, {
        externalStatus: latestExternalStatus,
        songId,
        updatedAt: FieldValue.serverTimestamp(),
      });
      batch.update(db.collection(COLLECTIONS.TASK_STATUSES).doc(taskRef.id), {
        status: mapExternalStatus(latestExternalStatus).status,
        songId,
        updatedAt: FieldValue.serverTimestamp(),
      });
      await batch.commit();
      if (latestExternalStatus === "SUCCESS") {
        return; // Done, no retry needed
      } else if (["TEXT_SUCCESS", "FIRST_SUCCESS"].includes(latestExternalStatus)) {
        // Intermediate success - need to keep polling
        throw new HttpsError(
          'failed-precondition',
          `Generation in progress (${latestExternalStatus}), continuing to poll.`
        );
      }
    }
    throw new HttpsError('internal', `Unexpected status: ${latestExternalStatus}`);
  }
);

export async function enqueuePollGenerationStatusTask(
  taskId: string,
  options: TaskOptions,
) {
  const queue = getFunctions().taskQueue(`locations/${REGION}/functions/pollGenerationStatusTask`);
  const id = [...`pollGenerationStatus-${taskId}`].reverse().join("");
  return queue.enqueue({ taskId }, {
    ...options,
    id, // Ensure non-duplicate tasks
  });
}