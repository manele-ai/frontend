import admin from "firebase-admin";
import { FieldValue } from "firebase-admin/firestore";
import { getFunctions, TaskOptions } from "firebase-admin/functions";
import { onTaskDispatched } from "firebase-functions/tasks";
import { logger } from "firebase-functions/v2";
import { HttpsError } from "firebase-functions/v2/https";
import { readFileSync } from "fs";
import path from 'path';
import { initiateMusicGeneration } from "../../api/music";
import { generateLyrics } from "../../api/openai";
import { db, REGION } from "../../config";
import { COLLECTIONS } from "../../constants/collections";
import { handleGenerationFailed } from "../../service/generation/failure";
import { Database, Requests } from "../../types";
import { enqueuePollGenerationStatusTask } from "./pollGenerationStatus";

function loadStylePrompt(style: string) {
  const stylePromptFilePath = path.join(__dirname, `../../data/prompts/${style}/STYLE_PROMPT.md`);
  const stylePrompt = readFileSync(stylePromptFilePath, 'utf8');
  return stylePrompt;
}

async function tryAcquireGenerationLock(requestId: string): Promise<boolean> {
  return await db.runTransaction(async (transaction) => {
    const requestRef = db.collection(COLLECTIONS.GENERATION_REQUESTS).doc(requestId);
    const requestDoc = await transaction.get(requestRef);
    if (requestDoc.exists && requestDoc.data()?.generationStarted) {
      return false; // Already started
    }
    transaction.update(requestRef, {
      generationStarted: true,
      generationStartedAt: FieldValue.serverTimestamp() as admin.firestore.Timestamp,
    });
    return true; // We are first to start
  });
}

const WATERMARK_TEXT = "Generat cu manele punct io"

export const generateSongTask = onTaskDispatched({
  retryConfig: {
    maxAttempts: 1, // No retries
    maxRetrySeconds: 0,
  },
  rateLimits: {
    maxConcurrentDispatches: 80, // don't matter?
    maxDispatchesPerSecond: 2, // 20 requests per 10 seconds = 2 per second
  },
  memory: "256MiB",
}, async (request) => {
  const { userId, generationData, requestId } = request.data as {
    userId: string;
    generationData: Requests.GenerateSong;
    requestId: string;
  };

  let error: Error | null = null;
  let errorMessage: string | null = null;

  try {
    // Acquiring without releasing is fine because we only try the task once anyway
    const alreadyStarted = await tryAcquireGenerationLock(requestId);
    if (!alreadyStarted) {
      logger.log(`Generation lock for request ${requestId} already acquired, skipping duplicate execution`);
      return;
    }

    // Verify that the user exists in the database
    const userDoc = await db.collection(COLLECTIONS.USERS).doc(userId).get();
    if (!userDoc.exists) {
      throw new HttpsError('not-found', 'User not found');
    }
    // First, generate lyrics and style description using OpenAI
    const { lyrics: rawLyrics } = await generateLyrics(generationData);

    // Add watermark at the end of lyrics
    const lyrics = rawLyrics + `\n\n[Spoken Words Male Voice]\n${WATERMARK_TEXT}`;

    const stylePrompt = loadStylePrompt(generationData.style);

    // Then, use the generated content to initiate music generation
    // TODO: check for code here
    const musicApiResponse = await initiateMusicGeneration({
      lyrics,
      title: generationData.title,
      stylePrompt,
      testMode: !!generationData.testMode,
    });
    if (!musicApiResponse.data.taskId) {
      throw new HttpsError('internal', 'Received invalid response from music API');
    }
    const externalTaskId = musicApiResponse.data.taskId;
    logger.log(`Created task ${externalTaskId} for generation request ${requestId}`);

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
        lyricsDetails: generationData.lyricsDetails,
        from: generationData.from,
        to: generationData.to,
        dedication: generationData.dedication,
        wantsDedication: generationData.wantsDedication,
        wantsDonation: generationData.wantsDonation,
        donorName: generationData.donorName,
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
        lyricsDetails: generationData.lyricsDetails,
        from: generationData.from,
        to: generationData.to,
        dedication: generationData.dedication,
        wantsDedication: generationData.wantsDedication,
        wantsDonation: generationData.wantsDonation,
        donorName: generationData.donorName,
        donationAmount: generationData.donationAmount
      },
      lyrics,
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
