import admin from "firebase-admin";
import { FieldValue } from "firebase-admin/firestore";
import { logger } from "firebase-functions/v2";
import { onDocumentWritten } from "firebase-functions/v2/firestore";
import { HttpsError } from "firebase-functions/v2/https";
import { db } from "../../config";
import { COLLECTIONS } from "../../constants/collections";
import { Database } from "../../types";

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

function parseDonationAmount(donationAmount: string | number | undefined) {
  if (!donationAmount) return 0;
  // Check if the donationAmount is already a number
  if (typeof donationAmount === 'number') {
    return Math.floor(donationAmount);  // Ensure it's an integer (rounded down)
  }
  // Parse the donation amount as a float and round down to the nearest integer
  const parsedAmount = parseFloat(donationAmount);
  // If the parsed amount is a valid number (not NaN), return the rounded value as an integer
  if (!isNaN(parsedAmount)) {
    return Math.floor(parsedAmount);
  }
  // If the donation amount is not valid, return 0
  return 0;
}

export const updateStatsAndLeaderboardOnTaskSuccess = onDocumentWritten(
  `${COLLECTIONS.TASK_STATUSES}/{taskId}`,
  async (event) => {
    const taskId = event.params.taskId;
    const taskStatusBefore = event.data?.before.data() as Database.TaskStatus;
    const taskStatusAfter = event.data?.after.data() as Database.TaskStatus;
    
    if (!event.data?.after.exists || !taskStatusAfter) {
      // Do nothing when deleted
      return;
    }

    // If status not currently completed or partial, do nothing
    if (!['partial', 'completed'].includes(taskStatusAfter.status)) {
      return;
    }

    // If status was previosly completed or partial, do nothing
    if (['completed', 'partial'].includes(taskStatusBefore.status)) {
      return;
    }
    
    try {
      // Get the task document
      const taskStatuskRef = event.data?.after.ref;
      
      // Get the user document
      const userRef = admin.firestore().collection(COLLECTIONS.USERS).doc(taskStatusAfter.userId);
      const userDoc = await userRef.get();
      
      if (!userDoc.exists) {
        logger.error(`User ${taskStatusAfter.userId} not found for task ${taskId}`);
        return;
      }

      await db.runTransaction(async (transaction) => {
        const taskStatusDoc = await transaction.get(taskStatuskRef);
        if (!taskStatusDoc.exists) {
          logger.error(`Task ${taskId} not found`);
          return;
        }

        const latestTaskData = taskStatusDoc.data() as Database.TaskStatus;

        const statsAlreadyUpdated = latestTaskData.statsAlreadyUpdated;
        if (statsAlreadyUpdated) {
          console.log(`Stats already updated for task ${taskId}`);
          return;
        }

        // Update flag to avoid duplicate stats updates
        transaction.update(taskStatuskRef, {
          statsAlreadyUpdated: true
        });
        
        // Update the user document
        const userGenerationInput = taskStatusAfter.userGenerationInput;
        const donationAmount = parseDonationAmount(userGenerationInput.donationAmount);

        transaction.update(userRef, {
          updatedAt: FieldValue.serverTimestamp(),
          // Update all-time stats using dot notation to avoid overwriting
          'stats.numSongsGenerated': FieldValue.increment(1),
          'stats.sumDonationsTotal': FieldValue.increment(
            userGenerationInput.wantsDonation ? donationAmount : 0
          ),
          'stats.numDedicationsGiven': FieldValue.increment(
            userGenerationInput.wantsDedication ? 1 : 0
          )
        });

        // Update the stats per timeframe
        const userId = latestTaskData.userId;
        const ts = taskStatusAfter.createdAt.toDate();
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
            shouldUpdate: userGenerationInput.wantsDedication,
            value: 1
          },
          donations: {
            name: 'donationValue',
            shouldUpdate: userGenerationInput.wantsDonation,
            value: donationAmount
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

              transaction.set(statRef, {
                count: FieldValue.increment(bucket.value),
                lastUpdated: FieldValue.serverTimestamp()
              }, { merge: true });
            }
          });
        });
      });
    } catch (error) {
      logger.error(`Error updating user stats and leaderboard for task ${taskId}:`, error);
      throw new HttpsError(
        'internal',
        'Failed'
      );
    }
  });