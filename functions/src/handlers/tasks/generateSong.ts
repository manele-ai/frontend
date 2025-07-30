import admin from "firebase-admin";
import { FieldValue } from "firebase-admin/firestore";
import { getFunctions, TaskOptions } from "firebase-admin/functions";
import { onTaskDispatched } from "firebase-functions/tasks";
import { logger } from "firebase-functions/v2";
import { HttpsError } from "firebase-functions/v2/https";
import { initiateMusicGeneration } from "../../api/music";
import { generateLyricsAndStyle } from "../../api/openai";
import { db, REGION } from "../../config";
import { COLLECTIONS } from "../../constants/collections";
import { handleGenerationFailed } from "../../service/generation/failure";
import { Database, Requests } from "../../types";
import { enqueuePollGenerationStatusTask } from "./pollGenerationStatus";

export const generateSongTask = onTaskDispatched({
  retryConfig: {
    maxAttempts: 1, // No retries
    maxRetrySeconds: 0,
  },
  rateLimits: {
    maxConcurrentDispatches: 20,
    maxDispatchesPerSecond: 2, // 20 requests per 10 seconds = 2 per second
  },
}, async (request) => {
  const { userId, generationData, requestId } = request.data;

  let error: Error | null = null;
  let errorMessage: string | null = null;

  try {
    // Verify that the user exists in the database
    const userDoc = await db.collection(COLLECTIONS.USERS).doc(userId).get();
    if (!userDoc.exists) {
      throw new HttpsError('not-found', 'User not found');
    }
    // First, generate lyrics and style description using OpenAI
    const { lyrics, styleDescription } = await generateLyricsAndStyle(
      generationData.style,
      generationData.title,
      generationData.lyricsDetails,
      generationData.wantsDedication ? {
        from: generationData.from,
        to: generationData.to,
        message: generationData.dedication
      } : undefined,
      generationData.wantsDonation ? {
        amount: generationData.donationAmount || 0
      } : undefined
    );

    // Then, use the generated content to initiate music generation
    const musicApiResponse = await initiateMusicGeneration(
      lyrics,
      generationData.title,
      styleDescription
    );
    if (!musicApiResponse.data.taskId) {
      throw new HttpsError('internal', 'Received invalid response from music API');
    }
    const externalTaskId = musicApiResponse.data.taskId;

    const batch = db.batch();
    // Write new task and its mirrored task status
    const newTaskRef = db.collection(COLLECTIONS.GENERATE_SONG_TASKS).doc();
    const taskId = newTaskRef.id;
    
    batch.update(db.collection(COLLECTIONS.GENERATION_REQUESTS).doc(requestId), {
      taskId,
      updatedAt: FieldValue.serverTimestamp() as admin.firestore.Timestamp,
    });

    batch.set(newTaskRef, {
      userId,
      externalId: externalTaskId,
      externalStatus: "PENDING",
      requestId,
      createdAt: FieldValue.serverTimestamp() as admin.firestore.Timestamp,
      updatedAt: FieldValue.serverTimestamp() as admin.firestore.Timestamp,
      userGenerationInput: {
        style: generationData.style,
        title: generationData.title,
        from: generationData.from,
        to: generationData.to,
        dedication: generationData.dedication,
        wantsDedication: generationData.wantsDedication,
        wantsDonation: generationData.wantsDonation,
        donationAmount: generationData.donationAmount
      }
    } as Database.GenerateSongTask);

    const newTaskStatusRef = db.collection(COLLECTIONS.TASK_STATUSES).doc(newTaskRef.id);
    batch.set(newTaskStatusRef, {
      status: "processing",
      userId,
      requestId,
      userGenerationInput: {
        style: generationData.style,
        title: generationData.title,
        from: generationData.from,
        to: generationData.to,
        dedication: generationData.dedication,
        wantsDedication: generationData.wantsDedication,
        wantsDonation: generationData.wantsDonation,
        donationAmount: generationData.donationAmount
      },
      createdAt: FieldValue.serverTimestamp() as admin.firestore.Timestamp,
      updatedAt: FieldValue.serverTimestamp() as admin.firestore.Timestamp,
    } as Database.TaskStatus);

    await batch.commit();

    // Enqueue a task to poll the generation status
    await enqueuePollGenerationStatusTask(newTaskRef.id, {
      scheduleDelaySeconds: 0,
      dispatchDeadlineSeconds: 30,
    });

  } catch (e) {
    error = e as Error;
    if (error instanceof Error) {
      logger.error("Error in generateSongTask:", error);
      errorMessage = error.message || 'Internal server error while initiating music generation.';
    } else {
      logger.error("Unknown error in generateSongTask:", error);
      errorMessage = 'Internal server error while initiating music generation.';
    }
    await handleGenerationFailed(userId, requestId, errorMessage);
  }
});

export async function enqueueGenerateSongTask(
  userId: string,
  generationData: Requests.GenerateSong,
  requestId: string,
  options: TaskOptions,
) {
  const queue = getFunctions().taskQueue(`locations/${REGION}/functions/generateSongTask`);
  const id = [...`generateSong-${requestId}`].reverse().join("");
  return queue.enqueue({ 
    userId,
    generationData,
    requestId
  }, {
    ...options,
    id, // Ensure non-duplicate tasks
  });
}
