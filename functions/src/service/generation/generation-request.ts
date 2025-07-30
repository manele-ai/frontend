import { FieldValue } from "firebase-admin/firestore";
import { db } from "../../config";
import { COLLECTIONS } from "../../constants/collections";
import { Database } from "../../types";

/**
 * Creates a generation request in a transaction to ensure atomic operations.
 * 
 * Key behaviors:
 * - Runs in a transaction to ensure atomicity
 * - Checks user existence and credits/subscription status
 * - Determines payment path based on user's credits and subscription
 * - Decrements user credits if using free credits
 * - Creates generation request with appropriate payment status
 * 
 * Payment paths:
 * - Credits: User has free credits (creditsBalance > 0)
 * - Subscription Free: User has active subscription with free credits
 * - Subscription Discount: User has active subscription but no free credits
 * - One-time Unsubscribed: User has no subscription or credits
 * 
 * @param userId - The ID of the user creating the generation request
 * @param data - The user's generation input data (style, title, dedication, etc.)
 * @returns Object containing:
 *   - requestId: ID of the created generation request
 *   - paymentType: Type of payment used ('credits', 'subscription_free', 'subscription_discount', 'onetime_unsubscribed')
 *   - paymentStatus: Status of payment ('success' for free credits, 'pending' for paid requests)
 * @throws {Error} If user is not found
 */
export async function createGenerationRequestTransaction(
    userId: string,
    data: Database.UserGenerationInput,
) {
  return db.runTransaction(async (transaction) => {
    const userRef = db.collection(COLLECTIONS.USERS).doc(userId);
    const userDoc = await transaction.get(userRef);
    
    if (!userDoc.exists) {
      throw new Error('User not found');    
    }

    const userData = userDoc.data() as Database.User;
    const { paymentType, initialPaymentStatus } = determinePaymentPath(userData);

    if ((paymentType === 'credits' || paymentType === 'subscription_free') 
        && initialPaymentStatus === 'success'
    ) {
      // Decrement now to avoid double-spending (concurrent generation requests from same user)
      await decrementUserCredits(transaction, userRef);
    }

    // Create the generation request
    const now = FieldValue.serverTimestamp();
    const generationRequestRef = db.collection(COLLECTIONS.GENERATION_REQUESTS).doc();
    const generationRequest: Database.GenerationRequest = {
      userId,
      paymentType: paymentType,
      paymentStatus: initialPaymentStatus,
      createdAt: now as any,
      updatedAt: now as any,
      userGenerationInput: {
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
    transaction.set(generationRequestRef, generationRequest);

    return {
      requestId: generationRequestRef.id,
      paymentType: paymentType,
      paymentStatus: initialPaymentStatus,
    };
  });
}

/**
 * Determines the payment type and initial payment status based on user's subscription and credits.
 * 
 * Logic:
 * 1. If user has free credits:
 *    - With subscription → subscription_free + success
 *    - Without subscription → credits + success
 * 2. If user has subscription but no credits → subscription_discount + pending
 * 3. Otherwise → onetime_unsubscribed + pending
 * 
 * @param userData - The user's data containing subscription and credits information
 * @returns Object containing payment type and initial payment status
 */
function determinePaymentPath(userData: Database.User): {
    paymentType: Database.GenerationRequest['paymentType'];
    initialPaymentStatus: Database.GenerationRequest['paymentStatus'];
  } {
    const isSubscribed = userData.subscription?.status === 'active';
    const hasFree = (userData.creditsBalance || 0) > 0;
  
    if (hasFree) {
      return {
        paymentType: isSubscribed ? 'subscription_free' : 'credits',
        initialPaymentStatus: 'success'
      };
    } else if (isSubscribed) {
      return {
        paymentType: 'subscription_discount',
        initialPaymentStatus: 'pending'
      };
    } else {
      return {
        paymentType: 'onetime_unsubscribed',
        initialPaymentStatus: 'pending'
      };
    }
}

/**
 * Decrements the user's credits balance in a transaction.
 * Used when a user has free credits available for generation.
 * 
 * @param transaction - The Firestore transaction to use
 * @param userRef - Reference to the user's document
 */
async function decrementUserCredits(
    transaction: FirebaseFirestore.Transaction,
    userRef: FirebaseFirestore.DocumentReference
  ) {
    transaction.update(userRef, {
      creditsBalance: FieldValue.increment(-1),
      updatedAt: FieldValue.serverTimestamp(),
    });
  }