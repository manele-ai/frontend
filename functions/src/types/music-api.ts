// ============= Music API Types =============
// Prefix with 'ThirdParty' for external API interactions
export namespace MusicApi {
    // ============= Generate Requests =============
    export interface GenerateRequest {
      prompt?: string;
      style?: string;
      title?: string;
      customMode: boolean;
      instrumental: boolean;
      model?: "V3_5" | "V4" | "V4_5";
      negativeTags?: string[];
      callBackUrl?: string;
    }

    // ============= Responses =============
    export interface Response<T> {
      code: number;
      msg: string;
      data: T;
    }
  
    export interface GenerateResponseData {
      taskId: string;
    }

    export interface StatusResponseData {
      taskId: string;
      parentMusicId?: string;
      param: string;
      response: {
        taskId: string;
        sunoData: SunoData[];
      };
      status: TaskStatus;
      type: TaskType;
      operationType: OperationType;
      errorCode?: number;
      errorMessage?: string;
    }

    export interface SunoData {
      id: string;
      audioUrl?: string;
      sourceAudioUrl?: string;
      streamAudioUrl: string;
      sourceStreamAudioUrl?: string;
      imageUrl?: string;
      sourceImageUrl?: string;
      prompt: string;
      modelName: string;
      title: string;
      tags: string;
      createTime: string;
      duration: number;
    }

    // ============= Shared Types =============
    // Common types used across different contexts
    export type TaskStatus = 
        | 'PENDING'
        | 'TEXT_SUCCESS'
        | 'FIRST_SUCCESS'
        | 'SUCCESS'
        | 'CREATE_TASK_FAILED'
        | 'GENERATE_AUDIO_FAILED'
        | 'CALLBACK_EXCEPTION'
        | 'SENSITIVE_WORD_ERROR';
    export type OperationType = 'generate' | 'extend' | 'upload_cover' | 'upload_extend';
    export type TaskType = 'chirp-v3-5' | 'chirp-v4';
}