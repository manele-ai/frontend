import { db, stripe } from "../../config";
import { COLLECTIONS } from "../../constants/collections";
import { Database } from "../../types";

/**
 * Creates a new Stripe customer and updates the user document with the customer ID.
 * @param userId - The ID of the user to create a customer for.
 * @param email - The email of the user to create a customer for.
 * @returns The ID of the created customer.
 */
export const createCustomer = async (userId: string, email: string) => {
    if (!stripe) {
        throw new Error('Stripe not initialized');
    }
    // Create a new Stripe customer
    const customer = await stripe.customers.create({
        email: email,
        metadata: {
            userId: userId,
        },
    });
    // Update the user document with the customer ID
    const userRef = db.collection(COLLECTIONS.USERS).doc(userId);
    await userRef.update({
        stripeCustomerId: customer.id,
    });
  return customer.id;
};

/**
 * Gets the customer ID for a user from the user document.
 * @param userId - The ID of the user to get the customer ID for.
 * @returns The ID of the customer.
 */
export const getCustomerIdByUserId = async (userId: string) => {
  const userRef = db.collection(COLLECTIONS.USERS).doc(userId);
  const userDoc = await userRef.get();
  if (!userDoc.exists) {
    throw new Error('User not found');
  }
  return userDoc.data()?.stripeCustomerId;
};

/**
 * Gets user data for a given Stripe customer ID.
 * @param customerId - The Stripe customer ID to look up
 * @returns The user data, reference and id
 * @throws {Error} If no user is found with the given customer ID
 */
export const getUserByStripeCustomerId = async (customerId: string) => {
  const querySnap = await db.collection(COLLECTIONS.USERS)
    .where('stripeCustomerId', '==', customerId)
    .limit(1)
    .get();

  if (querySnap.empty) {
    throw new Error(`[STRIPE HOOK] No user found for customer: ${customerId}`);
  }

  const userDoc = querySnap.docs[0];
  return {
    ref: userDoc.ref,
    data: userDoc.data() as Database.User,
    id: userDoc.id,
  };
};