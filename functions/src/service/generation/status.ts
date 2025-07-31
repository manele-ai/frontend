import { FieldValue } from "firebase-admin/firestore";
import { logger } from "firebase-functions/v2";
import { getTaskStatus } from "../../api/music";
import { db } from "../../config";
import { COLLECTIONS } from "../../constants/collections";
import { FAILURE_STATUSES, hasAdvanced, mapExternalStatus, SUCCESS_STATUSES } from "../../handlers/utils/status";
import { Database } from "../../types";
import { handleGenerationFailed } from "./failure";

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

export async function getGenerationStatus(taskId: string): Promise<{
    shouldRetry: boolean;
    status: Database.GenerationStatus;
}> {
    if (!taskId) {
      logger.error("Missing taskId in task payload");
      return {shouldRetry: false, status: "failed"};
    }

    const taskRef = db.collection(COLLECTIONS.GENERATE_SONG_TASKS).doc(taskId);
    const taskDoc = await taskRef.get();
    if (!taskDoc.exists) {
      return {shouldRetry: false, status: "failed"};
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
      logger.info(`Generation status is already ${currExternalStatus}, no retry needed`);
      return {shouldRetry: false, status: mapExternalStatus(currExternalStatus).status};
    } 

    const { status: latestExternalStatus, response } = (await getTaskStatus(externalTaskId)).data;
    // Check if status has advanced
    if (!hasAdvanced(currExternalStatus, latestExternalStatus)) {
      // Retry later
      logger.info(`Status has not advanced from ${currExternalStatus} to ${latestExternalStatus}, retrying later`);
      return {shouldRetry: true, status: mapExternalStatus(currExternalStatus).status};
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
      return {shouldRetry: false, status: "failed"};
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
        return {shouldRetry: false, status: "completed"};
      } else if (["TEXT_SUCCESS", "FIRST_SUCCESS"].includes(latestExternalStatus)) {
        // Intermediate success - need to keep polling
        return {shouldRetry: true, status: "partial"};
      }
    }
    // Should never happen, but just in case
    return {shouldRetry: true, status: "processing"};
}