import admin from "firebase-admin";
import { MusicApi } from "./music-api";

// ============= Database Types =============
// Prefix with 'DB' to clearly identify Firestore stored types
export namespace Database {
  export interface UserGenerationInput {
    style: string;
    title: string;
    from?: string;
    to?: string;
    dedication?: string;
    wantsDedication?: boolean;
    wantsDonation?: boolean;
    donationAmount?: number;
  }

  export type GenerationStatus = 
  | 'processing'
  | 'partial'
  | 'completed'
  | 'failed';

  export interface GenerateSongTask {
    userId: string;
    externalId: string;
    externalStatus: MusicApi.TaskStatus;
    error?: string;
    createdAt: admin.firestore.Timestamp;
    updatedAt: admin.firestore.Timestamp;
    lastStatusPollAt?: admin.firestore.Timestamp;
    songIds?: string[]; // ignore for now
    songId?: string;
    userGenerationInput: UserGenerationInput;
    requestId: string;
  }

  export interface TaskStatus {
    userId: string;
    status: GenerationStatus;
    songId?: string;
    error?: string;
    requestId: string;
    userGenerationInput: UserGenerationInput;
    createdAt: admin.firestore.Timestamp;
    updatedAt: admin.firestore.Timestamp;
  }

  export interface GenerationRequest {
    userId: string;
    taskId?: string;
    paymentStatus: // Overall payment status (can only pay at once)
      'pending'
      | 'success'
      | 'failed'; 
    songPaymentType:
      'balance'
      | 'subscription_free'
      | 'subscription_discount'
      | 'onetime_unsubscribed';
    dedicationPaymentType:
      'no_payment'
      | 'balance'
      | 'onetime';
    aruncaCuBaniAmountToPay?: number;
    shouldFulfillDedication?: boolean;
    shouldFulfillAruncaCuBani?: boolean;
    aruncaCuBaniAmountToFulfill?: number;
    error?: string;
    refundedAsCredit?: boolean;
    paymentSessionId?: string;
    createdAt: admin.firestore.Timestamp;
    updatedAt: admin.firestore.Timestamp;
    userGenerationInput: UserGenerationInput;
  }
  
  export interface User {
    uid: string;
    displayName: string;
    photoURL?: string;
    createdAt: admin.firestore.Timestamp;
    updatedAt: admin.firestore.Timestamp;
    stripeCustomerId?: string;
    creditsBalance?: number;
    dedicationBalance?: number;
    aruncaCuBaniBalance?: number;
    lastSubPeriodCreditGrant?: admin.firestore.Timestamp;
    subscription?: {
      stripeSubscriptionId: string;
      status: string;
      priceId: string;
      currentPeriodStart: admin.firestore.Timestamp;
      currentPeriodEnd: admin.firestore.Timestamp;
      cancelAtPeriodEnd: boolean;
      paymentMethod: {
        last4: string;
        brand: string;
      } | null;
    }
    stats: {
      numSongsGenerated: number
      numDedicationsGiven: number;
      sumDonationsTotal: number;
    }
  }

  export interface UserPublic {
    uid: string;
    displayName: string;
    createdAt: admin.firestore.Timestamp;
    photoURL?: string;
    stats: {
      numSongsGenerated: number;
      numDedicationsGiven: number;
      sumDonationsTotal: number;
    }
  }
  
  export interface SongData {
    // Override the id field with our naming
    externalId: string;
    // Additional fields
    taskId: string;
    externalTaskId: string;
    userId: string;
    createdAt: admin.firestore.Timestamp;
    updatedAt: admin.firestore.Timestamp;
    storage?: {
      url: string;
      path: string;
      sizeBytes: number;
      contentType: string;
    };
    // Metadata about the generation request
    userGenerationInput: UserGenerationInput;
    // API data
    apiData: MusicApi.SunoData;
  }

  export interface SongDataPublic {
    taskId: string;
    userId: string;
    createdAt: admin.firestore.Timestamp;
    updatedAt: admin.firestore.Timestamp;
    storage: {
      url: string;
      sizeBytes: number;
      contentType: string;
    } | null;
    userGenerationInput: UserGenerationInput;
    apiData: {
      audioUrl: string;
      streamAudioUrl: string;
      imageUrl: string;
      title: string;
      duration: number;
    }
  }
}
