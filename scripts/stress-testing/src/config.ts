import { config } from 'dotenv';
import { FirebaseConfig, StagingConfig } from './types';

// Load environment variables
config();

export const firebaseConfig: FirebaseConfig = {
  projectId: process.env.FIREBASE_PROJECT_ID || 'manele-io-test',
  privateKey: process.env.FIREBASE_PRIVATE_KEY ? 
    (process.env.FIREBASE_PRIVATE_KEY.startsWith('{') ? 
      JSON.parse(process.env.FIREBASE_PRIVATE_KEY).private_key?.replace(/\\n/g, '\n') || '' :
      process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n')) : '',
  clientEmail: process.env.FIREBASE_CLIENT_EMAIL || '',
};

export const stagingConfig: StagingConfig = {
  functionsUrl: process.env.STAGING_FUNCTIONS_URL || 'https://europe-central2-manele-io-test.cloudfunctions.net',
  frontendUrl: process.env.STAGING_FRONTEND_URL || 'https://staging-9bha86vbc1980bca71.manele.io',
  projectId: process.env.FIREBASE_PROJECT_ID || 'manele-io-test',
};

export const testConfig = {
  accountsCount: parseInt(process.env.TEST_ACCOUNTS_COUNT || '100'),
  emailPrefix: process.env.TEST_EMAIL_PREFIX || 'stress.test',
  emailDomain: process.env.TEST_EMAIL_DOMAIN || 'gmail.com',
  password: process.env.TEST_PASSWORD || 'StressTest123!',
  maxConcurrentRequests: parseInt(process.env.MAX_CONCURRENT_REQUESTS || '50'),
  requestsPerSecond: parseInt(process.env.REQUESTS_PER_SECOND || '2'),
  testDurationSeconds: parseInt(process.env.TEST_DURATION_SECONDS || '300'),
};

// Validation
export function validateConfig(): void {
  if (!firebaseConfig.privateKey) {
    throw new Error('FIREBASE_PRIVATE_KEY is required');
  }
  if (!firebaseConfig.clientEmail) {
    throw new Error('FIREBASE_CLIENT_EMAIL is required');
  }
  if (!firebaseConfig.projectId) {
    throw new Error('FIREBASE_PROJECT_ID is required');
  }
}

// Available music styles for testing (from web-app/src/data/stylesData.js)
export const MUSIC_STYLES = [
  'jale',
  'opulenta',
  'manele-live',
  'trapanele',
  'de-pahar',
  'populara',
  'orientale',
  'lautaresti'
];

// Sample titles for testing
export const SAMPLE_TITLES = [
  'Dragostea mea',
  'Noaptea de vis',
  'Bucuria vieții',
  'Memoriile de altădată',
  'Fericirea de azi',
  'Visul meu',
  'Cântecul inimii',
  'Momentul perfect',
  'Sufletul meu',
  'Dorul de acasă'
];

// Sample lyrics details for testing
export const SAMPLE_LYRICS_DETAILS = [
  'O piesă despre dragoste și fericire',
  'Cântec despre prietenie și loialitate',
  'Melodie despre dorul de casă',
  'Versuri despre bucuria vieții',
  'Cântec despre speranță și visuri',
  'Melodie despre iubirea de viață',
  'Versuri despre momentele frumoase',
  'Cântec despre prietenia adevărată'
];
