import { logger } from "firebase-functions/v2";
import { MusicApi } from "../types/music-api";

export function initiateMusicGenerationMock(): MusicApi.Response<MusicApi.GenerateResponseData> {
  const taskId = `mock-${Date.now()}-${Math.random().toString(36).slice(2,8)}`;
  logger.info(`🎵 Music API MOCK activ – taskId=${taskId}`);
  return { code: 200, msg: 'OK', data: { taskId } };
}

export function getTaskStatusMock(externaTaskId: string): MusicApi.Response<MusicApi.StatusResponseData> {
  const ts = Number(externaTaskId.split('-')[1]) || Date.now();
  const elapsed = Date.now() - ts;
  // Fast thresholds for stress tests (can be tuned via env)
  const TEXT_MS = parseInt(process.env.MOCK_TEXT_SUCCESS_MS || '0', 10);
  const FIRST_MS = parseInt(process.env.MOCK_FIRST_SUCCESS_MS || '150', 10);
  const SUCCESS_MS = parseInt(process.env.MOCK_SUCCESS_MS || '300', 10);

  let status: MusicApi.TaskStatus = 'PENDING';
  if (elapsed >= TEXT_MS) status = 'TEXT_SUCCESS';
  if (elapsed >= FIRST_MS) status = 'FIRST_SUCCESS';
  if (elapsed >= SUCCESS_MS) status = 'SUCCESS';
  const title = `Mock Song ${externaTaskId.slice(-6)}`;
  return {
    code: 200,
    msg: 'OK',
    data: {
      taskId: externaTaskId,
      param: '{}',
      response: {
        taskId: externaTaskId,
        sunoData: [
          {
            id: `song-${externaTaskId}`,
            audioUrl: status === 'SUCCESS' ? `https://mock.audio/${externaTaskId}.mp3` : undefined,
            streamAudioUrl: `https://mock.stream/${externaTaskId}.mp3`,
            imageUrl: `https://mock.image/${externaTaskId}.jpg`,
            prompt: 'mock',
            modelName: 'V4_5PLUS',
            title,
            tags: 'mock',
            createTime: new Date(ts).toISOString(),
            duration: 120,
          }
        ]
      },
      status,
      type: 'chirp-v4',
      operationType: 'generate'
    }
  };
}


