import { FieldValue } from "firebase-admin/firestore";
import { logger } from "firebase-functions/v2";
import { db } from "../../config";
import { COLLECTIONS } from "../../constants/collections";

export async function handleGenerationError(userId: string, generationRequestId: string, errorMessage: string) {
    const batch = db.batch();

    // Update the generation request status
    const requestRef = db.collection(COLLECTIONS.GENERATION_REQUESTS).doc(generationRequestId);
    batch.update(requestRef, {
      error: errorMessage,
      updatedAt: FieldValue.serverTimestamp(),
    });
  
    // Refund the credit
    const userRef = db.collection(COLLECTIONS.USERS).doc(userId);
    batch.update(userRef, {
      numCredits: FieldValue.increment(1),
      updatedAt: FieldValue.serverTimestamp(),
    });
  
    try {
      await batch.commit();
    } catch (error) {
      logger.error("Failed to handle generation error:", error);
    }
}