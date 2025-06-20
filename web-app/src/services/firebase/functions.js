import { httpsCallable } from 'firebase/functions';
import { functions } from './index';

/**
 * @param {object} data
 * @returns {Promise<{taskId: string, externalTaskId: string}>}
 */
export const generateSong = async (data) => {
  const generateSongFunction = httpsCallable(functions, 'generateSong');
  const result = await generateSongFunction(data);
  return /** @type {{taskId: string, externalTaskId: string}} */ (result.data);
}; 

/**
 * @param {object} data
 * @returns {Promise<{status: 'processing' | 'completed' | 'failed', songData?: object, error?: string}>}
 */
export const getGenerationStatus = async (data) => {
  const getStatusFunction = httpsCallable(functions, 'getGenerationStatus');
  const result = await getStatusFunction(data);
  return /** @type {{status: 'processing' | 'completed' | 'failed', songData?: object, error?: string}} */ (result.data);
};

/**
 * @param {object} data
 * @returns {Promise<{storageUrl: string}>}
 */
export const downloadSong = async (data) => {
  const downloadFunction = httpsCallable(functions, 'downloadSong');
  const result = await downloadFunction(data);
  return /** @type {{storageUrl: string}} */ (result.data);
}; 