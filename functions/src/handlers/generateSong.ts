import admin from "firebase-admin";
import { HttpsError, onCall } from "firebase-functions/v2/https";
import { initiateMusicGeneration } from "../api/music-api";
import { generateLyricsAndStyle } from "../api/openai-api";
import { COLLECTIONS } from "../constants/collections";
import { Database, Requests } from "../types";

export const generateSongHandler = onCall<Requests.GenerateSong>(
  async (request) => {
    // Ensure user is authenticated
    const {data, auth} = request;

    if (!auth) {
      throw new HttpsError('unauthenticated', 'Not authenticated.');
    }

    try {
      // Verify that the user exists in the database
      const userDoc = await admin.firestore().collection(COLLECTIONS.USERS).doc(auth.uid).get();
      if (!userDoc.exists) {
        throw new HttpsError('not-found', 'User not found in database. Please try logging in again.');
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
      
      const newTask: Database.GenerateSongTask = {
        userId: auth.uid,
        externalId: externalTaskId,
        status: "processing",
        createdAt: admin.firestore.FieldValue.serverTimestamp() as admin.firestore.Timestamp,
        updatedAt: admin.firestore.FieldValue.serverTimestamp() as admin.firestore.Timestamp,
        metadata: {
          style: data.style,
          title: data.title,
          from: data.from,
          to: data.to,
          dedication: data.dedication,
          wantsDedication: data.wantsDedication,
          wantsDonation: data.wantsDonation,
          donationAmount: data.donationAmount
        }
      };

      const newTaskRef = await admin.firestore().collection(COLLECTIONS.GENERATE_SONG_TASKS).add(newTask);

      return { message: "Music generation initiated.", taskId: newTaskRef.id, externalTaskId };

    } catch (error) {
      console.error("Error in generateSongHandler:", error);
      if (error instanceof HttpsError) {
        throw error;
      }
      throw new HttpsError('internal', 'Internal server error while initiating music generation.');
    }
});
