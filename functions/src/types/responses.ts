import { Database } from "./database";

// TODO; remove this file
export namespace Responses {
      // ============= API Response Types =============
  // Prefix with 'Response' for our HTTP responses
  export interface GenerateSong {
    message: string;
    taskId: string;
    requestId?: string;
  }
  
  export interface GetStatus {
    status: Database.GenerationStatus;
    songData?: {
      songId: string;
      audioUrl: string;
      title: string;
      artist: string;
      duration: number;
    };
    error?: string;
  }
}