import { FieldValue } from "firebase-admin/firestore";
import { HttpsError } from "firebase-functions/https";
import { logger } from "firebase-functions/v2";
import { db } from "../../config";
import { COLLECTIONS } from "../../constants/collections";

/**
 * Handles generation error by updating the generation request status and refunding the credit.
 * @param userId - The ID of the user who made the generation request.
 * @param generationRequestId - The ID of the generation request.
 * @param errorMessage - The error message to be stored in the generation request.
 */
export async function handleGenerationFailed(
  userId: string,
  generationRequestId: string,
  errorMessage: string
): Promise<void> {
  const reqRef = db
    .collection(COLLECTIONS.GENERATION_REQUESTS)
    .doc(generationRequestId);

  try {
    await db.runTransaction(async (tx) => {
      const reqSnap = await tx.get(reqRef);
      if (!reqSnap.exists) {
        throw new HttpsError("not-found", `GenerationRequest ${generationRequestId} not found`);
      }

      const reqData = reqSnap.data() as any;
      // If we've already refunded this, bail out
      if (reqData.refundedAsCredit === true) {
        return;
      }

      // 1) Mark the request as refunded
      tx.update(reqRef, {
        refundedAsCredit: true,
        error: errorMessage,
        updatedAt: FieldValue.serverTimestamp(),
      });

      // 2) Restore one credit
      const userRef = db.collection(COLLECTIONS.USERS).doc(userId);
      tx.update(userRef, {
        creditsBalance: FieldValue.increment(1),
        updatedAt: FieldValue.serverTimestamp(),
      });
    });
  } catch (err: any) {
    logger.error("handleGenerationFailed transaction error", err);
    // Wrap non-HttpsError so cloud function recognizes it as a failure
    if (err instanceof HttpsError) throw err;
    throw new HttpsError("internal", "Error during handleGenerationFailed");
  }
}