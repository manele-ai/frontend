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