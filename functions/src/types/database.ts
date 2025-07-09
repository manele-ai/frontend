import admin from "firebase-admin";
import { MusicApi } from "./music-api";
import { Shared } from "./shared";

// ============= Database Types =============
// Prefix with 'DB' to clearly identify Firestore stored types
export namespace Database {
  interface UserGenerationInput {
    style: string;
    title: string;
    from?: string;
    to?: string;
    dedication?: string;
    wantsDedication?: boolean;
    wantsDonation?: boolean;
    donationAmount?: number;
  }

  export interface GenerateSongTask {
    userId: string;
    externalId: string;
    status: Shared.GenerationStatus;
    externalStatus: MusicApi.TaskStatus;
    error?: string;
    createdAt: admin.firestore.Timestamp;
    updatedAt: admin.firestore.Timestamp;
    lastStatusPollAt?: admin.firestore.Timestamp;
    songIds?: string[];
    userGenerationInput: UserGenerationInput;
  }
  
  export interface User {
    uid: string;
    displayName?: string;
    photoURL?: string;
    createdAt: admin.firestore.Timestamp;
    updatedAt: admin.firestore.Timestamp;
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
    externalAudioUrl: string;
    storage: {
      url: string;
      sizeBytes: number;
      contentType: string;
    } | null;
    userGenerationInput: UserGenerationInput;
  }
}
