import { onCall, HttpsError } from "firebase-functions/v2/https";
import admin from "firebase-admin";
import { initiateMusicGeneration } from "../api/music-api";
import { Database } from "../types";
import { COLLECTIONS } from "../constants/collections";

interface GenerateSongData {
  prompt: string;
}


export const generateSongHandler = onCall<GenerateSongData>(
  async (request) => {
    // Ensure user is authenticated
    const {data, auth} = request;

    if (!auth) {
      throw new HttpsError('unauthenticated', 'Not authenticated.');
    }

    const { prompt } = data as GenerateSongData;
    if (!prompt) {
      throw new HttpsError('invalid-argument', 'The function must be called with a prompt.');
    }

    try {
      const musicApiResponse = await initiateMusicGeneration(prompt);
      const externalTaskId = musicApiResponse.data.taskId;
      const newTaskRef = admin.firestore().collection(COLLECTIONS.GENERATE_SONG_TASKS).doc();
      
      const newTask: Database.GenerateSongTask = {
        userId: auth.uid,
        externalId: externalTaskId,
        status: "processing",
        createdAt: admin.firestore.FieldValue.serverTimestamp() as admin.firestore.Timestamp,
        updatedAt: admin.firestore.FieldValue.serverTimestamp() as admin.firestore.Timestamp,
      };

      await newTaskRef.set(newTask);
      return { message: "Music generation initiated.", taskId: newTaskRef.id, externalTaskId };

    } catch (error) {
      console.error("Error in generateAudioHandler:", error);
      throw new HttpsError('internal', 'Internal server error while initiating music generation.');
    }
});
