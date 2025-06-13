import admin from "firebase-admin";

// ============= Utility Types =============
// Helper types for common patterns
export type WithTimestamps = {
  createdAt: admin.firestore.Timestamp;
  updatedAt: admin.firestore.Timestamp;
};

export type WithOptionalTimestamps = Partial<WithTimestamps>;

// Type guard for checking if a value is a Firebase Timestamp
export const isFirestoreTimestamp = (value: unknown): value is admin.firestore.Timestamp => {
  return value instanceof admin.firestore.Timestamp;
}; 