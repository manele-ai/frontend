import admin from "firebase-admin";
import { Shared } from "./shared";

// ============= Database Types =============
// Prefix with 'DB' to clearly identify Firestore stored types
export namespace Database {
  export interface GenerateSongTask {
    userId: string;
    externalId: string;
    status: Shared.GenerationStatus;
    error?: string;
    createdAt: admin.firestore.Timestamp;
    updatedAt: admin.firestore.Timestamp;
    songIds?: string[];
    // Metadata about the generation request
    metadata: {
      style: string;
      title: string;
      from?: string;
      to?: string;
      dedication?: string;
      wantsDedication?: boolean;
      wantsDonation?: boolean;
      donationAmount?: number;
    };
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
    externalId: string;
    taskId: string;
    userId: string;
    createdAt: admin.firestore.Timestamp;
    externalTaskId: string;
    audioUrl: string;
    storageUrl?: string;
    sourceAudioUrl: string;
    streamAudioUrl: string;
    sourceStreamAudioUrl: string;
    imageUrl: string;
    sourceImageUrl: string;
    prompt: string;
    modelName: string;
    title: string;
    tags: string;
    createTime: string;
    duration: number;
    // Metadata about the generation request
    metadata: {
      style: string;
      title: string;
      from?: string;
      to?: string;
      dedication?: string;
      wantsDedication?: boolean;
      wantsDonation?: boolean;
      donationAmount?: number;
    };
  }

  export interface SongDataPublic {
    audioUrl: string;
    metadata: {
      title: string;
      from?: string;
      to?: string;
      dedication?: string;
      wantsDedication?: boolean;
      wantsDonation?: boolean;
      donationAmount?: number;
    };
  }
}
