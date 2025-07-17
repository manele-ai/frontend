// API functions for the web app using Firebase Functions
import { generateSong } from '../services/firebase/functions';

/**
 * @param {object} data
 * @returns {Promise<{taskId: string, externalTaskId: string}>}
 */
export async function generateManeaSong(data) {
  try {
    // Call Firebase Function with the full data object
    const result = await generateSong(data);
    return result;
  } catch (e) {
    throw e;
  }
}

// Storage functions for web (using localStorage)
export function saveItem(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

export function getItem(key) {
  const value = localStorage.getItem(key);
  return value ? JSON.parse(value) : null;
}

export function removeItem(key) {
  localStorage.removeItem(key);
}

export function saveToList(key, item) {
  const list = getItem(key) || [];
  list.push(item);
  saveItem(key, list);
} 