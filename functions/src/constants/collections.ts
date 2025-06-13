/**
 * Firestore collection names used throughout the application
 * @description Constants for all Firestore collection names to ensure consistency and type safety
 */
export const COLLECTIONS = {
  /** Collection storing audio generation requests and their statuses */
  GENERATE_SONG_TASKS: 'tasks',
  /** Collection storing user data */
  USERS: 'users',
  /** Collection storing generated songs */
  SONGS: 'songs',
} as const;

// Type for collection names
export type CollectionName = typeof COLLECTIONS[keyof typeof COLLECTIONS]; 