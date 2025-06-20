// API functions for the web app using Firebase Functions
import { generateSong, getGenerationStatus } from '../services/firebase/functions';

// 1. Generate song using Firebase Functions
export async function generateManeaSong(data) {
  try {
    // Call Firebase Function with the full data object
    const result = await generateSong(data);
    return result;
  } catch (e) {
    throw e;
  }
}

// 2. Polling pentru statusul piesei generate
export async function pollManeaSongResult(taskId) {
  try {
    const result = await getGenerationStatus({ taskId });
    return result;
  } catch (e) {
    throw e;
  }
}

// 3. Trigger la finalizarea generării piesei (optional)
export async function triggerManeaSongComplete(taskId) {
  try {
    // This could be a separate Firebase Function if needed
    console.log('Song generation completed for task:', taskId);
    return { success: true };
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