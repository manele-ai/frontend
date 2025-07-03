import admin from "firebase-admin";
import * as functions from "firebase-functions/v2";
import { onDocumentCreated } from "firebase-functions/v2/firestore";
import { COLLECTIONS } from "../constants/collections";
import { Database } from "../types";
import { getPeriodKeys } from "./utils";

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
      
      // Update the task document
      batch.update(taskRef, {
        songIds: admin.firestore.FieldValue.arrayUnion(songId),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        status: "completed"
      });
      
      // Update the user document
      batch.update(userRef, {
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        // Update all-time stats
        stats: {
          numSongsGenerated: admin.firestore.FieldValue.increment(1),
          sumDonationsTotal: admin.firestore.FieldValue.increment(songData.metadata.wantsDonation ? 1 : 0),
          numDedicationsGiven: admin.firestore.FieldValue.increment(songData.metadata.wantsDedication ? 1 : 0)
        }
      });

      // Update the stats per timeframe
      const userId = songData.userId as string;
      const ts = songData.createdAt.toDate();
      const periods = getPeriodKeys(ts);

      // Define the stat buckets
      const buckets = {
        songs: {
          name: 'numSongsGenerated',
          shouldUpdate: true, // Always update songs
          value: 1
        },
        dedications: {
          name: 'numDedicationsGiven',
          shouldUpdate: songData.metadata.wantsDedication,
          value: 1
        },
        donations: {
          name: 'donationValue',
          shouldUpdate: songData.metadata.wantsDonation,
          value: 1
        }
      };

      // Update stats for each period and bucket
      Object.entries(periods).forEach(([periodType, periodKey]) => {
        // Create a document reference for the period
        const periodRef = admin.firestore()
          .collection('stats')
          .doc(periodType)
          .collection(periodKey);

        Object.values(buckets).forEach(bucket => {
          if (bucket.shouldUpdate) {
            // Create a document for each stat type with userId as the document ID
            const statRef = periodRef
              .doc('buckets')
              .collection(bucket.name)
              .doc(userId);

            batch.set(statRef, {
              count: admin.firestore.FieldValue.increment(bucket.value),
              lastUpdated: admin.firestore.FieldValue.serverTimestamp()
            }, { merge: true });
          }
        });
      });

      await batch.commit();
    } catch (error) {
      console.error(`Error in onSongCreated for song ${songId}:`, error);
      throw new functions.https.HttpsError(
        'internal',
        'Failed'
      );
    }
  });