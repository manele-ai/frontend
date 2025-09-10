import { MUSIC_STYLES, SAMPLE_LYRICS_DETAILS, SAMPLE_TITLES } from './config';
import { GenerationRequest, TestAccount } from './types';

/**
 * Generate a test account with the specified index
 */
export function generateTestAccount(index: number): TestAccount {
  const email = `stress.test${index}@gmail.com`;
  const displayName = `Stress Test User ${index}`;
  
  return {
    email,
    password: 'StressTest123!',
    displayName,
    status: 'pending'
  };
}

/**
 * Generate multiple test accounts
 */
export function generateTestAccounts(count: number): TestAccount[] {
  const accounts: TestAccount[] = [];
  
  for (let i = 1; i <= count; i++) {
    accounts.push(generateTestAccount(i));
  }
  
  return accounts;
}

/**
 * Generate a random generation request for testing
 */
export function generateRandomGenerationRequest(): GenerationRequest {
  const randomStyle = MUSIC_STYLES[Math.floor(Math.random() * MUSIC_STYLES.length)];
  const randomTitle = SAMPLE_TITLES[Math.floor(Math.random() * SAMPLE_TITLES.length)];
  const randomLyrics = SAMPLE_LYRICS_DETAILS[Math.floor(Math.random() * SAMPLE_LYRICS_DETAILS.length)];
  
  // Randomly decide if we want dedication and donation
  const wantsDedication = Math.random() > 0.5;
  const wantsDonation = Math.random() > 0.7;
  
  const request: GenerationRequest = {
    title: randomTitle,
    lyricsDetails: randomLyrics,
    style: randomStyle,
    wantsDedication,
    wantsDonation: false, // Disable donation for stress testing
    from: wantsDedication ? 'Test User' : undefined,
    to: wantsDedication ? 'Loved One' : undefined,
    dedication: wantsDedication ? 'Cu dragoste și respect' : undefined,
    donorName: undefined,
    donationAmount: undefined
  };
  
  return request;
}

/**
 * Sleep for specified milliseconds
 */
export function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Format duration in milliseconds to human readable format
 */
export function formatDuration(ms: number): string {
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  
  if (hours > 0) {
    return `${hours}h ${minutes % 60}m ${seconds % 60}s`;
  } else if (minutes > 0) {
    return `${minutes}m ${seconds % 60}s`;
  } else {
    return `${seconds}s`;
  }
}

/**
 * Format bytes to human readable format
 */
export function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

/**
 * Calculate percentage
 */
export function calculatePercentage(part: number, total: number): number {
  if (total === 0) return 0;
  return Math.round((part / total) * 100 * 100) / 100; // Round to 2 decimal places
}

/**
 * Generate a random delay between min and max milliseconds
 */
export function randomDelay(minMs: number, maxMs: number): number {
  return Math.floor(Math.random() * (maxMs - minMs + 1)) + minMs;
}

/**
 * Retry a function with exponential backoff
 */
export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  baseDelayMs: number = 1000
): Promise<T> {
  let lastError: Error;
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;
      
      if (attempt === maxRetries) {
        throw lastError;
      }
      
      const delay = baseDelayMs * Math.pow(2, attempt);
      await sleep(delay);
    }
  }
  
  throw lastError!;
}

/**
 * Validate email format
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Generate a unique request ID
 */
export function generateRequestId(): string {
  return `stress-test-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Log with timestamp
 */
export function logWithTimestamp(message: string, level: 'INFO' | 'WARN' | 'ERROR' = 'INFO'): void {
  const timestamp = new Date().toISOString();
  const prefix = `[${timestamp}] [${level}]`;
  console.log(`${prefix} ${message}`);
}
