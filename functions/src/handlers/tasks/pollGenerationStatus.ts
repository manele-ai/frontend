import { getFunctions, TaskOptions } from "firebase-admin/functions";
import { onTaskDispatched } from "firebase-functions/tasks";
import { logger } from "firebase-functions/v2";
import { HttpsError } from "firebase-functions/v2/https";
import { REGION } from "../../config";
import { getGenerationStatus } from "../../service/generation/status";

export const pollGenerationStatusTask = onTaskDispatched({
    retryConfig: { // Every 10 seconds for 6 minutes = 36 attempts
      maxAttempts: 36,
      minBackoffSeconds: 10,
      maxBackoffSeconds: 10,
      maxDoublings: 0,
    },
    rateLimits: {
      maxConcurrentDispatches: 1000, // don't matter?
      maxDispatchesPerSecond: 50, // 50 tasks per second = 3,000 tasks per minute = 180,000 tasks per hour
    },
    memory: "128MiB",
  },
  async (req) => {
    const { taskId } = req.data || {};
    if (!taskId) {
      logger.error("Missing taskId in task payload");
      // No retry needed
      return;
    }

    const { shouldRetry } = await getGenerationStatus(taskId);
    if (shouldRetry) {
      // This will trigger a retry
      throw new HttpsError("internal", "Generation status is not ready yet, retrying later");
    }
    // No retry needed, done
    return;
  }
);

export async function enqueuePollGenerationStatusTask(
  taskId: string,
  options: TaskOptions,
) {
  const queue = getFunctions().taskQueue(`locations/${REGION}/functions/pollGenerationStatusTask`);
  const id = [...`pollGenerationStatus-${taskId}`].reverse().join("");
  return queue.enqueue({ taskId }, {
    ...options,
    id, // Ensure non-duplicate tasks
  });
}