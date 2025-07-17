import admin from "firebase-admin";
import { FieldValue } from "firebase-admin/firestore";
import { logger } from "firebase-functions/v2";
import { HttpsError, onCall } from "firebase-functions/v2/https";
import { initiateMusicGeneration } from "../api/music-api";
import { generateLyricsAndStyle } from "../api/openai-api";
import { db } from "../config";
import { COLLECTIONS } from "../constants/collections";
import { Database, Requests } from "../types";
import { enqueuePollGenerationStatusTask } from "./tasks/pollGenerationStatus";

export const generateSong = onCall<Requests.GenerateSong>(
  async (request) => {
    // Ensure user is authenticated
    const {data, auth} = request;

    if (!auth) {
      throw new HttpsError('unauthenticated', 'Not authenticated.');
    }

    try {
      // Verify that the user exists in the database
      const userDoc = await db.collection(COLLECTIONS.USERS).doc(auth.uid).get();
      if (!userDoc.exists) {
        throw new HttpsError('not-found', 'Not found.');
      }

      // First, generate lyrics and style description using OpenAI
      const { lyrics, styleDescription } = await generateLyricsAndStyle(
        data.style,
        data.title,
        data.lyricsDetails,
        data.wantsDedication ? {
          from: data.from,
          to: data.to,
          message: data.dedication
        } : undefined,
        data.wantsDonation ? {
          amount: data.donationAmount || 0
        } : undefined
      );

      // Then, use the generated content to initiate music generation
      const musicApiResponse = await initiateMusicGeneration(
        lyrics,
        data.title,
        styleDescription
      );

      const externalTaskId = musicApiResponse.data.taskId;

      const batch = db.batch();
      // Write new task and its mirrored task status
      const newTaskRef = db.collection(COLLECTIONS.GENERATE_SONG_TASKS).doc();
      batch.set(newTaskRef, {
        userId: auth.uid,
        externalId: externalTaskId,
        externalStatus: "PENDING",
        createdAt: FieldValue.serverTimestamp() as admin.firestore.Timestamp,
        updatedAt: FieldValue.serverTimestamp() as admin.firestore.Timestamp,
        userGenerationInput: {
          style: data.style,
          title: data.title,
          from: data.from,
          to: data.to,
          dedication: data.dedication,
          wantsDedication: data.wantsDedication,
          wantsDonation: data.wantsDonation,
          donationAmount: data.donationAmount
        }
      } as Database.GenerateSongTask);

      const newTaskStatusRef = db.collection(COLLECTIONS.TASK_STATUSES).doc(newTaskRef.id);
      batch.set(newTaskStatusRef, {
        status: "processing",
        userId: auth.uid,
        userGenerationInput: {
          style: data.style,
          title: data.title,
          from: data.from,
          to: data.to,
          dedication: data.dedication,
          wantsDedication: data.wantsDedication,
          wantsDonation: data.wantsDonation,
          donationAmount: data.donationAmount
        },
        createdAt: FieldValue.serverTimestamp() as admin.firestore.Timestamp,
        updatedAt: FieldValue.serverTimestamp() as admin.firestore.Timestamp,
      } as Database.TaskStatus);

      await batch.commit();

      // Enqueue a task to poll the generation status
      try {
        await enqueuePollGenerationStatusTask(newTaskRef.id, {
          scheduleDelaySeconds: 0, // send after 3 seconds
          dispatchDeadlineSeconds: 30,
        });
      } catch (error: any) {
        if (error.code === "functions/task-already-exists") {
          logger.info(`pollGenerationStatusTask for ${newTaskRef.id} already enqueued, skipping.`);
        } else {
          logger.error("Error in enqueuePollGenerationStatusTask:", error);
          throw new HttpsError('internal', 'Internal server error while enqueuing poll generation status task.');
        }
      }

      return { taskId: newTaskRef.id };

    } catch (error) {
      logger.error("Error in generateSongHandler:", error);
      if (error instanceof HttpsError) {
        throw error;
      }
      throw new HttpsError('internal', 'Internal server error while initiating music generation.');
    }
});
