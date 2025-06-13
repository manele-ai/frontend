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
  }
  
  export interface User {
    taskIds?: string[];
    songIds?: string[];
    createdAt: admin.firestore.Timestamp;
    updatedAt: admin.firestore.Timestamp;
  }
  
  export interface SongData {
    externalId: string;
    taskId: string;
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
