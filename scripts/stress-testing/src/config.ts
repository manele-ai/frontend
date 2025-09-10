import { config } from 'dotenv';
import * as fs from 'fs';
import * as path from 'path';
import { FirebaseConfig, LocalConfig, StagingConfig } from './types';

// Load environment variables - try .env_local first, then .env
config({ path: '.env_local' });
config();

// Try to load Firebase credentials based on environment
let firebasePrivateKey = '';
let firebaseClientEmail = '';

// Determine which env file to use based on TEST_ENVIRONMENT
const isStaging = process.env.TEST_ENVIRONMENT === 'staging';
const envFile = isStaging ? '.env_staging' : '.env_local';

try {
  const envPath = path.join(__dirname, '..', envFile);
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf8');
    
    // Parse FIREBASE_PRIVATE_KEY
    const privateKeyMatch = envContent.match(/FIREBASE_PRIVATE_KEY=(.+)/);
    if (privateKeyMatch && privateKeyMatch[1]) {
      try {
        const parsed = JSON.parse(privateKeyMatch[1]);
        firebasePrivateKey = parsed.private_key?.replace(/\\n/g, '\n') || '';
        firebaseClientEmail = parsed.client_email || '';
        console.log(`🔍 Successfully parsed Firebase credentials from ${envFile}`);
      } catch (error) {
        console.error(`🔍 Failed to parse FIREBASE_PRIVATE_KEY JSON from ${envFile}:`, error);
      }
    }
  }
} catch (error) {
  console.error(`🔍 Failed to read ${envFile}:`, error);
}

export const firebaseConfig: FirebaseConfig = {
  projectId: process.env.FIREBASE_PROJECT_ID || 'manele-io-test',
  privateKey: firebasePrivateKey || process.env.FIREBASE_PRIVATE_KEY || '',
  clientEmail: firebaseClientEmail || process.env.FIREBASE_CLIENT_EMAIL || '',
};

export const stagingConfig: StagingConfig = {
  functionsUrl: process.env.STAGING_FUNCTIONS_URL || 'https://europe-central2-manele-io-test.cloudfunctions.net',
  frontendUrl: process.env.STAGING_FRONTEND_URL || 'https://staging-9bha86vbc1980bca71.manele.io',
  projectId: process.env.FIREBASE_PROJECT_ID || 'manele-io-test',
};

// Local emulator configuration
export const localConfig: LocalConfig = {
  useEmulator: process.env.USE_EMULATOR === 'true' || false,
  emulatorHost: process.env.EMULATOR_HOST || '127.0.0.1',
  emulatorPorts: {
    functions: parseInt(process.env.EMULATOR_FUNCTIONS_PORT || '5001'),
    firestore: parseInt(process.env.EMULATOR_FIRESTORE_PORT || '8081'),
    auth: parseInt(process.env.EMULATOR_AUTH_PORT || '9099'),
    storage: parseInt(process.env.EMULATOR_STORAGE_PORT || '9199'),
  },
  backendUrl: process.env.LOCAL_BACKEND_URL || 'http://127.0.0.1:5001',
  projectId: process.env.LOCAL_PROJECT_ID || 'manele-io-test',
};

// Environment switching configuration
export const environmentConfig = {
  // Set to 'local' for localhost:5001 + emulator, 'staging' for cloud functions
  current: process.env.TEST_ENVIRONMENT || 'local',
  
  // Local environment
  local: {
    backendUrl: 'http://localhost:5001',
    firestoreHost: '127.0.0.1:8081',
    useEmulator: true
  },
  
  // Staging environment  
  staging: {
    backendUrl: 'https://europe-central2-manele-io-test.cloudfunctions.net',
    firestoreHost: 'production',
    useEmulator: false
  }
};

// Log emulator configuration for debugging
console.log('🔧 Emulator Configuration:');
console.log(`   USE_EMULATOR: ${process.env.USE_EMULATOR}`);
console.log(`   EMULATOR_HOST: ${process.env.EMULATOR_HOST}`);
console.log(`   EMULATOR_FIRESTORE_PORT: ${process.env.EMULATOR_FIRESTORE_PORT}`);
console.log(`   EMULATOR_AUTH_PORT: ${process.env.EMULATOR_AUTH_PORT}`);
console.log(`   localConfig.useEmulator: ${localConfig.useEmulator}`);

export const testConfig = {
  accountsCount: parseInt(process.env.TEST_ACCOUNTS_COUNT || '100'),
  emailPrefix: process.env.TEST_EMAIL_PREFIX || 'stress.test',
  emailDomain: process.env.TEST_EMAIL_DOMAIN || 'gmail.com',
  password: process.env.TEST_PASSWORD || 'StressTest123!',
  maxConcurrentRequests: parseInt(process.env.MAX_CONCURRENT_REQUESTS || '50'),
  requestsPerSecond: parseInt(process.env.REQUESTS_PER_SECOND || '2'),
  testDurationSeconds: parseInt(process.env.TEST_DURATION_SECONDS || '300'),
  // Mock configuration
  mockOpenAI: process.env.MOCK_OPENAI === 'true' || true,
  mockSuno: process.env.MOCK_SUNO === 'true' || true,
  mockDelay: {
    openai: parseInt(process.env.MOCK_OPENAI_DELAY || '2000'), // 2 seconds
    suno: parseInt(process.env.MOCK_SUNO_DELAY || '5000'),    // 5 seconds
  },
  // Test collection configuration
  testCollection: process.env.TEST_COLLECTION || 'generationRequests',
  useRealCollection: process.env.USE_REAL_COLLECTION === 'true' || false,
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
