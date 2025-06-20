import { httpsCallable } from 'firebase/functions';
import { functions } from './index';

/**
 * @param {object} data
 */
export const generateSong = async (data) => {
  const generateSongFunction = httpsCallable(functions, 'generateSong');
  const result = await generateSongFunction(data);
  return result.data;
}; 

/**
 * @param {object} data
 */
export const getGenerationStatus = async (data) => {
  const getStatusFunction = httpsCallable(functions, 'getGenerationStatus');
  const result = await getStatusFunction(data);
  return result.data;
};

/**
 * @param {object} data
 */
export const downloadSong = async (data) => {
  const downloadFunction = httpsCallable(functions, 'downloadSong');
  const result = await downloadFunction(data);
  return result.data;
}; 