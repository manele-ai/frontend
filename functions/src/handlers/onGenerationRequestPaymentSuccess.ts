import { HttpsError } from "firebase-functions/https";
import { logger } from "firebase-functions/v2";
import { onDocumentWritten } from "firebase-functions/v2/firestore";
import { COLLECTIONS } from "../constants/collections";
import { handleGenerationError } from "../service/generation/handleGenerationError";
import { Database, Requests } from "../types";
import { enqueueGenerateSongTask } from "./tasks/generateSong";

export const onGenerationRequestPaymentSuccess = onDocumentWritten(
  `${COLLECTIONS.GENERATION_REQUESTS}/{requestId}`,
  async (event) => {
    const before = event.data?.before.data() as Database.GenerationRequest | undefined;
    const after = event.data?.after.data() as Database.GenerationRequest | undefined;
    const requestId = event.params.requestId;

    // Proceed only if document *now* has paymentStatus === "success" and it was not already marked as success
    if (!after || after.paymentStatus !== 'success') {
      return; // Nothing to do – still pending/failed/etc.
    }
    if (before && before.paymentStatus === 'success') {
      return; // It was already success before – ignore duplicate writes.
    }

    try {
      const generationData: Requests.GenerateSong = {
        ...after.userGenerationInput,
        wantsDedication: after.userGenerationInput.wantsDedication || false,
        wantsDonation: after.userGenerationInput.wantsDonation || false
      };

      await enqueueGenerateSongTask(
        after.userId,
        generationData,
        requestId,
        {
          scheduleDelaySeconds: 0,
          dispatchDeadlineSeconds: 15, // 15 seconds
        }
      );

      logger.info(`Successfully enqueued generateSongTask for request ${requestId}`);
    } catch (error) {
      logger.error(`Error enqueueing generateSongTask for request ${requestId}:`, error);
      await handleGenerationError(after.userId, requestId, 'Failed to enqueue generateSongTask.');
      throw new HttpsError('internal', 'Failed to enqueue generateSongTask. Credit refunded.');
    }
  }
); 