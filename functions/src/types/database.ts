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
    metadata?: {
      style?: string;
      title?: string;
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
    email: string;
    displayName?: string;
    photoURL?: string;
    taskIds?: string[];
    songIds?: string[];
    createdAt: admin.firestore.Timestamp;
    updatedAt: admin.firestore.Timestamp;
    preferences?: {
      favoriteStyles?: string[];
      language?: string;
    };
  }
  
  export interface SongData {
    externalId: string;
    taskId: string;
    userId: string;
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
  }
}
