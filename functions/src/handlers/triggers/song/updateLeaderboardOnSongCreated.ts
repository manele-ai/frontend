import admin from "firebase-admin";
import { FieldValue } from "firebase-admin/firestore";
import { logger } from "firebase-functions/v2";
import { onDocumentCreated } from "firebase-functions/v2/firestore";
import { HttpsError } from "firebase-functions/v2/https";
import { COLLECTIONS } from "../../../constants/collections";
import { Database } from "../../../types";

export function getPeriodKeys(ts: Date) {
  const y = ts.getUTCFullYear();
  const m = `${ts.getUTCMonth() + 1}`.padStart(2, "0");
  const d = `${ts.getUTCDate()}`.padStart(2, "0");

  // ――― ISO-8601 week number (1‥53) ―――
  const startOfYear = Date.UTC(y, 0, 1);        // 00:00 UTC Jan-01
  const dayOfYear   = Math.floor((ts.getTime() - startOfYear) / 86_400_000) + 1;
  const isoWeek     = Math.ceil((dayOfYear + 6 - (ts.getUTCDay() || 7)) / 7);

  return {
    day:   `${y}${m}${d}`,               // 20250703
    week:  `${y}-W${String(isoWeek).padStart(2, "0")}`, // 2025-W27
    month: `${y}${m}`,                   // 202507
    year:  `${y}`,                       // 2025
  };
}

export const updateLeaderboardOnSongCreated = onDocumentCreated(
  `${COLLECTIONS.SONGS}/{songId}`,
  async (event) => {
    const songId = event.params.songId;
    const songData = event.data?.data() as Database.SongData;
    
    if (!songData) {
      logger.error(`No song data found for song ${songId}`);
      return;
    }
    
    try {
      // Get the task document
      const taskRef = admin.firestore().collection(COLLECTIONS.GENERATE_SONG_TASKS).doc(songData.taskId);
      const taskDoc = await taskRef.get();
      
      if (!taskDoc.exists) {
        logger.error(`Task ${songData.taskId} not found for song ${songId}`);
        return;
      }
      
      const taskData = taskDoc.data() as Database.GenerateSongTask;
      
      // Get the user document
      const userRef = admin.firestore().collection(COLLECTIONS.USERS).doc(taskData.userId);
      const userDoc = await userRef.get();
      
      if (!userDoc.exists) {
        logger.error(`User ${taskData.userId} not found for task ${songData.taskId}`);
        return;
      }
      
      // Start a batch write
      const batch = admin.firestore().batch();
      
      // Update the task document
      batch.update(taskRef, {
        songIds: FieldValue.arrayUnion(songId),
        updatedAt: FieldValue.serverTimestamp(),
        status: "completed"
      });
      
      // Update the user document
      batch.update(userRef, {
        updatedAt: FieldValue.serverTimestamp(),
        // Update all-time stats using dot notation to avoid overwriting
        'stats.numSongsGenerated': FieldValue.increment(1),
        'stats.sumDonationsTotal': FieldValue.increment(songData.userGenerationInput.wantsDonation ? 1 : 0),
        'stats.numDedicationsGiven': FieldValue.increment(songData.userGenerationInput.wantsDedication ? 1 : 0)
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
          shouldUpdate: songData.userGenerationInput.wantsDedication,
          value: 1
        },
        donations: {
          name: 'donationValue',
          shouldUpdate: songData.userGenerationInput.wantsDonation,
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
              count: FieldValue.increment(bucket.value),
              lastUpdated: FieldValue.serverTimestamp()
            }, { merge: true });
          }
        });
      });

      await batch.commit();
    } catch (error) {
      logger.error(`Error in onSongCreated for song ${songId}:`, error);
      throw new HttpsError(
        'internal',
        'Failed'
      );
    }
  });