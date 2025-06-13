import { httpsCallable } from 'firebase/functions';
import { functions } from './index';

// Define function types
interface GenerateSongData {
  prompt: string;
}

interface GenerateSongResponse {
  message: string;
  taskId: string;
  externalTaskId: string;
}

interface GetGenerationStatusData {
  taskId: string;
}

interface GetGenerationStatusResponse {
  status: 'pending' | 'processing' | 'completed' | 'failed';
  songData?: {
    songId: string;
    audioUrl: string;
    title: string;
    artist: string;
    duration: number;
  };
  error?: string;
}

interface DownloadSongData {
  songId: string;
}

interface DownloadSongResponse {
  downloadUrl: string;
  expiresAt: number;
}

export const generateSong = async (data: GenerateSongData): Promise<GenerateSongResponse> => {
  const generateSongFunction = httpsCallable<GenerateSongData, GenerateSongResponse>(
    functions,
    'generateSong'
  );
  const result = await generateSongFunction(data);
  return result.data;
}; 

export const getGenerationStatus = async (data: GetGenerationStatusData): Promise<GetGenerationStatusResponse> => {
  const getStatusFunction = httpsCallable<GetGenerationStatusData, GetGenerationStatusResponse>(
    functions,
    'getGenerationStatus'
  );
  const result = await getStatusFunction(data);
  return result.data;
};

export const downloadSong = async (data: DownloadSongData): Promise<DownloadSongResponse> => {
  const downloadFunction = httpsCallable<DownloadSongData, DownloadSongResponse>(
    functions,
    'downloadSong'
  );
  const result = await downloadFunction(data);
  return result.data;
}; 

