import admin from "firebase-admin";
import { onCall } from "firebase-functions/v2/https";
import { getTaskStatus } from "../api/music-api";
import { COLLECTIONS } from "../constants/collections";
import { Database, MusicApi, Shared } from "../types";

interface GetStatusData {
  taskId: string;
}

interface GetStatusResponseData {
  status: Shared.GenerationStatus;
  songData?: Database.SongData & { id: string }; // We return the song data when the task is completed, with the Firestore doc id
  error?: string; // We return the error message when the task fails
}

/**
 * Maps the external API's TaskStatus to our internal GenerationStatus
 * and provides appropriate error messages for failure states.
 */
function mapExternalStatus(externalStatus: MusicApi.TaskStatus): {
  dbStatus: Shared.GenerationStatus;
  errorMessage?: string;
} {
  // Success case
  if (externalStatus === "SUCCESS") {
    return { dbStatus: "completed" };
  }

  // Failure cases
  const failureStates: MusicApi.TaskStatus[] = [
    "CREATE_TASK_FAILED",
    "GENERATE_AUDIO_FAILED",
    "CALLBACK_EXCEPTION",
    "SENSITIVE_WORD_ERROR"
  ];

  if (failureStates.includes(externalStatus)) {
    return {
      dbStatus: "failed",
      errorMessage: `Task failed with status: ${externalStatus}`
    };
  }

  // Processing cases (PENDING, TEXT_SUCCESS, FIRST_SUCCESS)
  return { dbStatus: "processing" };
}

export const getGenerationStatusHandler = onCall<GetStatusData>(async (request) => {
  const { taskId } = request.data;

  if (!taskId) {
    throw new Error("Missing taskId parameter");
  }

  try {
    const taskRef = admin.firestore().collection(COLLECTIONS.GENERATE_SONG_TASKS).doc(taskId);
    const taskDoc = await taskRef.get();

    if (!taskDoc.exists) {
      throw new Error(`No generation request found for task ID: ${taskId}`);
    }

    // Check local status first
    const task = taskDoc.data() as Database.GenerateSongTask;
    if (task.status === "failed") {
      return { status: task.status };
    }
    
    // TODO: alternatively we could check in the taskDoc.songs ids (not sure which is better)
    if (task.status === "completed") {
      const songQuerySnapshot = await admin.firestore()
        .collection(COLLECTIONS.SONGS)
        .where("externalId", "==", task.externalId)
        .limit(1)
        .get();
      
      if (songQuerySnapshot.empty) {
        // This should never happen - if status is completed, song data must exist
        console.error(`Data integrity error: Task ${taskId} marked as completed but no song data found`);
        throw new Error("Internal server error: Data integrity issue detected");
      }

      const songDoc = songQuerySnapshot.docs[0];
      const songData = songDoc.data() as Database.SongData;
      const responseData: GetStatusResponseData = {
        status: task.status,
        songData: {
          id: songDoc.id,
          externalId: songData.externalId,
          taskId: taskDoc.id,
          externalTaskId: task.externalId,
          sourceAudioUrl: songData.audioUrl,
          sourceStreamAudioUrl: songData.streamAudioUrl,
          sourceImageUrl: songData.imageUrl,
          audioUrl: songData.audioUrl,
          streamAudioUrl: songData.streamAudioUrl,
          imageUrl: songData.imageUrl,
          prompt: songData.prompt,
          modelName: songData.modelName,
          title: songData.title,
          tags: songData.tags,
          createTime: songData.createTime,
          duration: songData.duration,
          storageUrl: songData.storageUrl
        },
      }
      return responseData;
    }
    
    // When status === "processing"
    const externalTaskId = task.externalId;
    const statusResponse = await getTaskStatus(externalTaskId);
    
    // Map the external status to our internal status and handle any errors
    const { dbStatus, errorMessage } = mapExternalStatus(statusResponse.data.status);
    
    // Prepare the Firestore update
    const updateData: Partial<Database.GenerateSongTask> = {
      status: dbStatus,
      updatedAt: admin.firestore.FieldValue.serverTimestamp() as admin.firestore.Timestamp,
      ...(errorMessage && { error: errorMessage }),
      songIds: []
    };

    // Initialize response payload
    let responsePayload: GetStatusResponseData = { status: dbStatus };

    // Handle successful completion
    if (statusResponse.data.status === "SUCCESS" && statusResponse.data.response.sunoData) {
      const songApiData = statusResponse.data.response.sunoData[0];
      // Create the database song data with all required fields
      const dbSongData: Database.SongData = {
        externalId: songApiData.id,
        taskId,
        externalTaskId,
        audioUrl: songApiData.audioUrl,
        sourceAudioUrl: songApiData.audioUrl,
        streamAudioUrl: songApiData.streamAudioUrl,
        sourceStreamAudioUrl: songApiData.streamAudioUrl,
        imageUrl: songApiData.imageUrl,
        sourceImageUrl: songApiData.imageUrl,
        prompt: songApiData.prompt,
        modelName: songApiData.modelName,
        title: songApiData.title,
        tags: songApiData.tags,
        createTime: songApiData.createTime,
        duration: songApiData.duration,
      };
      
      const songDoc = await admin.firestore().collection(COLLECTIONS.SONGS).add(dbSongData);

      // Attach the song ID to the task doc we’re about to update
      updateData.songIds = admin.firestore.FieldValue.arrayUnion(songDoc.id) as unknown as string[]; // cast keeps TS happy
      
      // Use type assertion to ensure TypeScript recognizes all fields are present
      responsePayload.songData = { ...dbSongData, id: songDoc.id };
      
      console.info(`Task ${taskId} completed. Song data received.`);
    } 
    // Handle failure
    else if (errorMessage) {
      responsePayload.error = errorMessage;
      console.warn(`Task ${taskId} failed: ${errorMessage}`);
    }

    // Update Firestore and respond
    await taskRef.update(updateData);
    console.info(`Updated Firestore for task ID: ${taskId} with status: ${dbStatus}`);
    
    return responsePayload;

  } catch (error) {
    console.error(`Error in getGenerationStatusHandler for task ID ${taskId}:`, error);
    throw new Error("Internal server error while checking generation status.");
  }
});
