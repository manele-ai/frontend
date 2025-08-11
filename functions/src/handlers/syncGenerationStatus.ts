import { logger } from "firebase-functions/v2";
import { HttpsError, onCall } from "firebase-functions/v2/https";
import { db, REGION } from "../config";
import { COLLECTIONS } from "../constants/collections";
import { getGenerationStatus } from "../service/generation/status";
import { Database } from "../types";

export const syncGenerationStatusForUser = onCall(
  { 
    region: REGION,
    enforceAppCheck: true,
  },
  async (request): Promise<{
    updates: {
      songId?: string;
      taskId: string;
      status: Database.GenerationStatus;
    }[];
  }> => {
    const { auth } = request;
    
    if (!auth) {
      throw new HttpsError("unauthenticated", "Must be authenticated to sync generation status");
    }

    // Get all incomplete tasks for the user
    const tasksQuery = await db.collection(COLLECTIONS.GENERATE_SONG_TASKS)
      .where("userId", "==", auth.uid)
      .where("externalStatus", "in", ["PENDING", "TEXT_SUCCESS"])
      .orderBy("createdAt", "desc")
      .limit(10)
      .get();

    if (tasksQuery.empty) {
      return { updates: [] };
    }

    const updates = await Promise.all(tasksQuery.docs.map(async (taskDoc) => {
      const task = taskDoc.data() as Database.GenerateSongTask;
      
      try {
        const { status } = await getGenerationStatus(taskDoc.id);
        return { songId: task?.songId, taskId: taskDoc.id, status };
      } catch (error) {
        logger.error(`Error syncing task ${taskDoc.id}:`, error);
        return {};
      }
    }));

    return { 
        updates: updates.filter(update => update.taskId && update.status) as {
            songId?: string;
            taskId: string;
            status: Database.GenerationStatus;
        }[]
    };
  }
);