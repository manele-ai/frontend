import axios from "axios";
import { logger } from "firebase-functions/v2";
import { FunctionsErrorCode, HttpsError } from "firebase-functions/v2/https";
import { thirdPartyApiBaseUrl, thirdPartyApiKey } from "../config";
import { MusicApi } from "../types/music-api";

const apiClient = axios.create({
  baseURL: thirdPartyApiBaseUrl.value(),
  headers: {
    "Authorization": `Bearer ${thirdPartyApiKey.value()}`,
    "Content-Type": "application/json",
  },
});

export interface InitiateMusicGenerationParams {
  lyrics: string;
  title: string;
  stylePrompt: string;
  negativeTags?: string[];
}

export async function initiateMusicGeneration({
  lyrics,
  title,
  stylePrompt,
  negativeTags,
}: InitiateMusicGenerationParams
): Promise<MusicApi.Response<MusicApi.GenerateResponseData>> {
  try {
    if (!lyrics || !title || !stylePrompt) {
      throw new Error("Missing required arguments for music generation");
    }
    const requestBody: MusicApi.GenerateRequest = {
      prompt: lyrics,
      style: stylePrompt,
      title: title,
      customMode: true,
      instrumental: false,
      model: "V4_5PLUS",
      negativeTags: negativeTags || ["pop", "trap"],
      callBackUrl: "https://your-callback-url.com", // TODO: handle callback with cloud functions http endpoint 
    }
    const { data } = await apiClient.post<MusicApi.Response<MusicApi.GenerateResponseData>>("/generate", requestBody);
    return data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      logger.error("[MUSIC][initiateMusicGeneration] Axios error calling music generation API", {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
        headers: error.response?.headers,
        config: error.config,
      });
      throw new Error("[MUSIC][initiateMusicGeneration] Axios error calling music generation API");
    }
    logger.error("[MUSIC][initiateMusicGeneration] Non-Axios error calling music generation API", { error });
    throw new Error("[MUSIC][initiateMusicGeneration] Non-Axios error calling music generation API");
  }
}

export async function getTaskStatus(externaTaskId: string): Promise<MusicApi.Response<MusicApi.StatusResponseData>> {
  try {
    logger.info(`[MUSIC][getTaskStatus] Fetching status for task ID: ${externaTaskId} from music API`);
    const { data } = await apiClient.get<MusicApi.Response<MusicApi.StatusResponseData>>('/generate/record-info', {
      params: {
        taskId: externaTaskId
      }
    });
    logger.info(`[MUSIC][getTaskStatus] Received status for task ID: ${externaTaskId}`, { responseData: data });

    // Handle specific error codes even with successful HTTP response
    if (data.code !== 200) {
      let errorType: FunctionsErrorCode = "internal";
      switch (data.code) {
        case 400:
          errorType = "invalid-argument";
          break;
        case 401:
          errorType = "unauthenticated";
          break;
        case 404:
          errorType = "not-found";
          break;
        case 405:
        case 429:
          errorType = "resource-exhausted";
          break;
        case 455:
          errorType = "unavailable";
          break;
        // 413, 500 and others default to "internal"
      }
      throw new HttpsError(
        errorType,
        data.msg || "Error from third-party API",
        data
      );
    }

    return data;
  } catch (error) {
    logger.error(`[MUSIC][getTaskStatus] Error fetching status for task ID: ${externaTaskId}`, { error });
    
    if (axios.isAxiosError(error)) {
      // Map HTTP errors to appropriate Firebase error types
      let errorType: FunctionsErrorCode = "internal";
      
      switch (error.response?.status) {
        case 400:
          errorType = "invalid-argument";
          break;
        case 401:
          errorType = "unauthenticated";
          break;
        case 404:
          errorType = "not-found";
          break;
        case 405:
        case 429:
          errorType = "resource-exhausted";
          break;
        case 455:
          errorType = "unavailable";
          break;
      }

      throw new HttpsError(
        errorType,
        `[MUSIC][getTaskStatus] Music generation API status error: ${error.message}`,
        error.response?.data
      );
    }
    
    throw new HttpsError(
      "internal",
      "[MUSIC][getTaskStatus] Failed to get task status from music generation API"
    );
  }
}

// export async function downloadAudioFile(audioUrl: string): Promise<Buffer> {
//   try {
//     functions.logger.info(`Downloading audio from URL: ${audioUrl}`);
//     const response = await axios.get(audioUrl, { responseType: "arraybuffer" });
//     functions.logger.info(`Successfully downloaded audio from URL: ${audioUrl}`);
//     return Buffer.from(response.data);
//   } catch (error) {
//     functions.logger.error(`Error downloading audio file from ${audioUrl}`, { error });
//     if (axios.isAxiosError(error)) {
//       throw new functions.https.HttpsError(
//         "internal",
//         `Failed to download audio file: ${error.message}`,
//         error.response?.data,
//       );
//     }
//     throw new functions.https.HttpsError("internal", "Failed to download audio file.");
//   }
// }
