import axios from "axios";
import * as functions from "firebase-functions";
import { thirdPartyApiBaseUrl, thirdPartyApiKey } from "../config";
import { MusicApi } from "../types/music-api";

const apiClient = axios.create({
  baseURL: thirdPartyApiBaseUrl.value(),
  headers: {
    "Authorization": `Bearer ${thirdPartyApiKey.value()}`,
    "Content-Type": "application/json",
  },
});

export async function initiateMusicGeneration(
  lyrics: string,
  title: string,
  style: string,
): Promise<MusicApi.Response<MusicApi.GenerateResponseData>> {
  try {
    if (!lyrics || !title || !style) {
      throw new Error("Missing required arguments for music generation");
    }
    const requestBody: MusicApi.GenerateRequest = {
      prompt: lyrics,
      style: style,
      title: title,
      customMode: true,
      instrumental: false,
      model: "V4_5",
      negativeTags: ["pop", "trap"],
      callBackUrl: "https://your-callback-url.com", // TODO: handle callback with cloud functions http endpoint 
    }
    functions.logger.info("Request body for music API /generate", requestBody);
    const { data } = await apiClient.post<MusicApi.Response<MusicApi.GenerateResponseData>>("/generate", requestBody);
    functions.logger.info("Received response from music API /generate", { responseData: data });
    return data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      functions.logger.error("Error calling third-party generation API", {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
        headers: error.response?.headers,
        config: error.config,
      });
      throw new functions.https.HttpsError(
        "internal",
        `Third-party API error: ${error.message}`,
        error.response?.data,
      );
    }
    functions.logger.error("Non-Axios error calling third-party generation API", { error });
    throw new functions.https.HttpsError("internal", "Failed to initiate music generation with third-party API.");
  }
}

export async function getTaskStatus(externaTaskId: string): Promise<MusicApi.Response<MusicApi.StatusResponseData>> {
  try {
    functions.logger.info(`Fetching status for task ID: ${externaTaskId} from music API`);
    const { data } = await apiClient.get<MusicApi.Response<MusicApi.StatusResponseData>>('/generate/record-info', {
      params: {
        taskId: externaTaskId
      }
    });
    functions.logger.info(`Received status for task ID: ${externaTaskId}`, { responseData: data });

    // Handle specific error codes even with successful HTTP response
    if (data.code !== 200) {
      let errorType: functions.https.FunctionsErrorCode = "internal";
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
      throw new functions.https.HttpsError(
        errorType,
        data.msg || "Error from third-party API",
        data
      );
    }

    return data;
  } catch (error) {
    functions.logger.error(`Error fetching status for task ID: ${externaTaskId}`, { error });
    
    if (axios.isAxiosError(error)) {
      // Map HTTP errors to appropriate Firebase error types
      let errorType: functions.https.FunctionsErrorCode = "internal";
      
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

      throw new functions.https.HttpsError(
        errorType,
        `Third-party API status error: ${error.message}`,
        error.response?.data
      );
    }
    
    throw new functions.https.HttpsError(
      "internal",
      "Failed to get task status from third-party API"
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
