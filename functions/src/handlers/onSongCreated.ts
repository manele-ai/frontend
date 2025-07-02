import admin from "firebase-admin";
import * as functions from "firebase-functions/v2";
import { onDocumentCreated } from "firebase-functions/v2/firestore";
import { COLLECTIONS } from "../constants/collections";
import { Database } from "../types";

/**
 * Cloud Function that triggers when a new song document is created in the songs collection.
 * It updates the relationships by:
 * 1. Adding the song ID to the task's songIds array
 * 2. Adding the song ID to the user's songIds array (user is found via the task)
 */
export const onSongCreatedHandler = onDocumentCreated(
  `${COLLECTIONS.SONGS}/{songId}`,
  async (event) => {
    const songId = event.params.songId;
    const songData = event.data?.data() as Database.SongData;
    
    if (!songData) {
      console.error(`No song data found for song ${songId}`);
      return;
    }
    
    try {
      // Get the task document
      const taskRef = admin.firestore().collection(COLLECTIONS.GENERATE_SONG_TASKS).doc(songData.taskId);
      const taskDoc = await taskRef.get();
      
      if (!taskDoc.exists) {
        console.error(`Task ${songData.taskId} not found for song ${songId}`);
        return;
      }
      
      const taskData = taskDoc.data() as Database.GenerateSongTask;
      
      // Get the user document
      const userRef = admin.firestore().collection(COLLECTIONS.USERS).doc(taskData.userId);
      const userDoc = await userRef.get();
      
      if (!userDoc.exists) {
        console.error(`User ${taskData.userId} not found for task ${songData.taskId}`);
        return;
      }
      
      // Start a batch write
      const batch = admin.firestore().batch();
      
      // Update the task document - add song ID to songIds array
      batch.update(taskRef, {
        songIds: admin.firestore.FieldValue.arrayUnion(songId),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        status: "completed"
      });
      
      // Update the user document - add song ID to songIds array
      batch.update(userRef, {
        songIds: admin.firestore.FieldValue.arrayUnion(songId),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        numSongsGenerated: admin.firestore.FieldValue.increment(1),
        sumDonationsTotal: admin.firestore.FieldValue.increment(songData.metadata.wantsDonation ? 1 : 0),
        numDedicationsGiven: admin.firestore.FieldValue.increment(songData.metadata.wantsDedication ? 1 : 0)
      });
      
      // Commit the batch
      await batch.commit();
      
      console.info(`Successfully linked song ${songId} to task ${songData.taskId} and user ${taskData.userId}`);
      
    } catch (error) {
      console.error(`Error in onSongCreated for song ${songId}:`, error);
      throw new functions.https.HttpsError(
        'internal',
        'Failed to update relationships for new song'
      );
    }
  }); 