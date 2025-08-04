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
 *   - paymentType: Type of payment used ('balance', 'subscription_free', 'subscription_discount', 'onetime_unsubscribed')
 *   - paymentStatus: Status of payment ('success' for free credits, 'pending' for paid requests)
 * @throws {Error} If user is not found
 */
export async function createGenerationRequestTransaction(
    userId: string,
    data: Database.UserGenerationInput,
) {
  // Default to what user wants for now, but flexibility to change later
  const shouldFulfillDedication = data.wantsDedication || false;
  const shouldFulfillAruncaCuBani = data.wantsDonation || false;
  const aruncaCuBaniAmountToFulfill = data.wantsDonation ? data.donationAmount || 0 : 0;
  
  return db.runTransaction(async (transaction) => {
    const userRef = db.collection(COLLECTIONS.USERS).doc(userId);
    const userDoc = await transaction.get(userRef);
    
    if (!userDoc.exists) {
      throw new Error('User not found');    
    }

    const userData = userDoc.data() as Database.User;
    const {
      songPaymentType,
      dedicationPaymentType,
      aruncaCuBaniAmountToPay,
      paymentStatus,
    } = determinePaymentTypes(
      userData, 
      {
        shouldFulfillDedication,
        shouldFulfillAruncaCuBani,
        aruncaCuBaniAmountToFulfill,
      }
    );

    // Decrement now to avoid double-spending (concurrent generation requests from same user)
    await decrementUserBalanceIfNeeded(
      transaction, 
      userRef, 
      {
        songPaymentType,
        dedicationPaymentType,
        aruncaCuBaniAmountToPay,
      }
    );

    // Create the generation request
    const now = FieldValue.serverTimestamp();
    const generationRequestRef = db.collection(COLLECTIONS.GENERATION_REQUESTS).doc();
    const generationRequest: Database.GenerationRequest = {
      userId,
      paymentStatus,
      songPaymentType,
      dedicationPaymentType,
      aruncaCuBaniAmountToPay,
      createdAt: now as any,
      updatedAt: now as any,
      shouldFulfillDedication,
      shouldFulfillAruncaCuBani,
      aruncaCuBaniAmountToFulfill,
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
      songPaymentType,
      dedicationPaymentType,
      aruncaCuBaniAmountToPay,
      paymentStatus,
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
function determinePaymentTypes(
  userData: Database.User, 
  data: {
    shouldFulfillDedication: boolean;
    shouldFulfillAruncaCuBani: boolean;
    aruncaCuBaniAmountToFulfill: number;
  }
): {
    songPaymentType: Database.GenerationRequest['songPaymentType'];
    dedicationPaymentType: Database.GenerationRequest['dedicationPaymentType'];
    aruncaCuBaniAmountToPay: Database.GenerationRequest['aruncaCuBaniAmountToPay'];
    paymentStatus: Database.GenerationRequest['paymentStatus'];
  } {
    const { shouldFulfillDedication, shouldFulfillAruncaCuBani, aruncaCuBaniAmountToFulfill } = data;

    // Check if song needs payment
    let songPaymentType: Database.GenerationRequest['songPaymentType'] = 'onetime_unsubscribed';
    const isSubscribed = userData.subscription?.status === 'active';
    const hasSongCredits = (userData.creditsBalance || 0) > 0;

    if (hasSongCredits) {
      songPaymentType = isSubscribed ? 'subscription_free' : 'balance';
    } else if (isSubscribed) {
      songPaymentType = 'subscription_discount';
    } else {
      songPaymentType = 'onetime_unsubscribed';
    }

    // Check if dedication needs payment
    let dedicationPaymentType: Database.GenerationRequest['dedicationPaymentType'] = 'onetime';
    if (shouldFulfillDedication) {
      if (userData.dedicationBalance && userData.dedicationBalance > 0) {
        dedicationPaymentType = 'balance';
      } else {
        dedicationPaymentType = 'onetime';
      }
    }
    
    // Check if arunca cu bani needs payment
    let aruncaCuBaniAmountToPay: Database.GenerationRequest['aruncaCuBaniAmountToPay'] = aruncaCuBaniAmountToFulfill;
    if (shouldFulfillAruncaCuBani && aruncaCuBaniAmountToFulfill > 0) {
      if (userData.aruncaCuBaniBalance 
        && (userData.aruncaCuBaniBalance - aruncaCuBaniAmountToFulfill) >= 0) {
        aruncaCuBaniAmountToPay = userData.aruncaCuBaniBalance - aruncaCuBaniAmountToFulfill;
      } else {
        aruncaCuBaniAmountToPay = aruncaCuBaniAmountToFulfill;
      }
    }

    // If we have a free generation, return success
    if (
      ['balance', 'subscription_free'].includes(songPaymentType)
      && dedicationPaymentType === 'balance'
      && aruncaCuBaniAmountToPay === 0
    ) {
      return {
        songPaymentType,
        dedicationPaymentType,
        aruncaCuBaniAmountToPay,
        paymentStatus: 'success', // Free generation
      };
    }

    // Otherwise, return pending
    return {
      songPaymentType,
      dedicationPaymentType,
      aruncaCuBaniAmountToPay,
      paymentStatus: 'pending',
    };
}

/**
 * Decrements the user's credits balance in a transaction.
 * Used when a user has free credits available for generation.
 * 
 * @param transaction - The Firestore transaction to use
 * @param userRef - Reference to the user's document
 */
async function decrementUserBalanceIfNeeded(
    transaction: FirebaseFirestore.Transaction,
    userRef: FirebaseFirestore.DocumentReference,
    paymentTypes: {
      songPaymentType: Database.GenerationRequest['songPaymentType'];
      dedicationPaymentType: Database.GenerationRequest['dedicationPaymentType'];
      aruncaCuBaniAmountToPay: Database.GenerationRequest['aruncaCuBaniAmountToPay'];
    }
  ) {
    const { songPaymentType, dedicationPaymentType, aruncaCuBaniAmountToPay } = paymentTypes;
    
    if (['balance', 'subscription_free'].includes(songPaymentType)) {
      transaction.update(userRef, {
        creditsBalance: FieldValue.increment(-1),
        updatedAt: FieldValue.serverTimestamp(),
      });
    }

    if (dedicationPaymentType === 'balance') {
      transaction.update(userRef, {
        dedicationBalance: FieldValue.increment(-1),
        updatedAt: FieldValue.serverTimestamp(),
      });
    }

    if (aruncaCuBaniAmountToPay && aruncaCuBaniAmountToPay > 0) {
      transaction.update(userRef, {
        aruncaCuBaniBalance: FieldValue.increment(-aruncaCuBaniAmountToPay),
        updatedAt: FieldValue.serverTimestamp(),
      });
    }
  }