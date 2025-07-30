import { FieldValue } from "firebase-admin/firestore";
import { logger } from "firebase-functions/v2";
import { onDocumentWritten } from "firebase-functions/v2/firestore";
import { db, REGION } from "../config";
import { COLLECTIONS } from "../constants/collections";
import { Database } from "../types";

/**
 * Cloud Function that triggers when a user's subscription period starts.
 * Adds 2 free credits to the user's creditsBalance as part of subscription benefits.
 * 
 * Triggers:
 * - When subscription.currentPeriodStart changes in a user document
 * - Only for active subscriptions
 * 
 * Key behaviors:
 * - Adds 2 credits to creditsBalance
 * - Only processes active subscriptions
 * - Uses transaction to ensure atomic update
 * - Updates timestamp to track last modification
 * - Prevents duplicate credit grants for the same period using lastSubPeriodCreditGrant
 * 
 * Edge cases handled:
 * - Multiple webhook events for same period start
 * - Subscription updates without period change
 * - Document deletions
 * - Missing or invalid data
 */
export const onSubPeriodStartChange = onDocumentWritten({
    document: `${COLLECTIONS.USERS}/{userId}`,
    region: REGION
}, async (event) => {
    const before = event.data?.before?.data() as Database.User | undefined;
    const after = event.data?.after?.data() as Database.User | undefined;

    // Skip if document was deleted
    if (!after) {
        return;
    }

    // Skip if no subscription data
    if (!after.subscription) {
        return;
    }

    // Only process active subscriptions
    if (after.subscription.status !== 'active') {
        return;
    }

    const isNewSubscription = !before?.subscription && after.subscription;
    const afterPeriodStart = after.subscription.currentPeriodStart;

    if (!afterPeriodStart) {
        logger.error('Missing currentPeriodStart in subscription data');
        return;
    }

    // Convert afterPeriodStart to seconds for consistent comparison
    const afterSeconds = afterPeriodStart.seconds;

    // Process either new subscription or period start change
    if (!isNewSubscription) {
        // Check if currentPeriodStart changed
        const beforePeriodStart = before?.subscription?.currentPeriodStart;

        // Convert to seconds for consistent comparison
        const beforeSeconds = beforePeriodStart?.seconds;

        if (beforeSeconds === afterSeconds) {
            return;
        }
    }

    const userId = event.data?.after?.id;
    
    if (!userId) {
        logger.error('Missing userId in event data');
        return;
    }
    
    try {
        await db.runTransaction(async (transaction) => {
            const userRef = db.collection(COLLECTIONS.USERS).doc(userId);
            const userDoc = await transaction.get(userRef);
            
            if (!userDoc.exists) {
                throw new Error(`User ${userId} not found`);
            }

            const userData = userDoc.data() as Database.User;
            
            // Check if we already granted credits for this period
            const lastGrantPeriod = userData.lastSubPeriodCreditGrant?.seconds;
            if (lastGrantPeriod && lastGrantPeriod >= afterSeconds) {
                logger.info(`Credits already granted for period starting at ${afterSeconds} for user ${userId}`);
                return;
            }

            transaction.update(userRef, {
                creditsBalance: FieldValue.increment(2),
                lastSubPeriodCreditGrant: afterPeriodStart,
                updatedAt: FieldValue.serverTimestamp()
            });
        });

        logger.info(`Added 2 subscription credits for user ${userId} for period starting at ${afterPeriodStart.seconds}`);
    } catch (error) {
        logger.error(`Failed to add subscription credits for user ${userId}:`, error);
        // Don't throw - let the function complete to avoid retries that might cause duplicate grants
    }
});
