import * as admin from 'firebase-admin';
import * as fs from 'fs';
import * as path from 'path';
import { firebaseConfig, testConfig } from './config';
import { TestAccount, TestAccountResult } from './types';
import { generateTestAccounts, logWithTimestamp, retryWithBackoff, sleep } from './utils';

// Set local emulator configuration if not already set
if (!process.env.USE_EMULATOR) {
  process.env.USE_EMULATOR = 'true';
}
if (!process.env.EMULATOR_HOST) {
  process.env.EMULATOR_HOST = '127.0.0.1';
}
if (!process.env.EMULATOR_FUNCTIONS_PORT) {
  process.env.EMULATOR_FUNCTIONS_PORT = '5001';
}
if (!process.env.EMULATOR_FIRESTORE_PORT) {
  process.env.EMULATOR_FIRESTORE_PORT = '8081';
}
if (!process.env.EMULATOR_AUTH_PORT) {
  process.env.EMULATOR_AUTH_PORT = '9099';
}

// Log emulator configuration for debugging
console.log('🔧 createTestAccounts.ts - Emulator Configuration:');
console.log(`   USE_EMULATOR: ${process.env.USE_EMULATOR}`);
console.log(`   EMULATOR_HOST: ${process.env.EMULATOR_HOST}`);
console.log(`   EMULATOR_FIRESTORE_PORT: ${process.env.EMULATOR_FIRESTORE_PORT}`);
console.log(`   EMULATOR_AUTH_PORT: ${process.env.EMULATOR_AUTH_PORT}`);

// Initialize Firebase Admin SDK
function initializeFirebase(): void {
  if (admin.apps.length === 0) {
    // Set emulator environment variables BEFORE initializing
    if (process.env.USE_EMULATOR === 'true') {
      process.env.FIRESTORE_EMULATOR_HOST = `${process.env.EMULATOR_HOST}:${process.env.EMULATOR_FIRESTORE_PORT}`;
      process.env.FIREBASE_AUTH_EMULATOR_HOST = `${process.env.EMULATOR_HOST}:${process.env.EMULATOR_AUTH_PORT}`;
      
      logWithTimestamp(`🔧 Connecting to local emulator:`);
      logWithTimestamp(`   - Firestore: ${process.env.FIRESTORE_EMULATOR_HOST}`);
      logWithTimestamp(`   - Auth: ${process.env.FIREBASE_AUTH_EMULATOR_HOST}`);
    }
    
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: firebaseConfig.projectId,
        privateKey: firebaseConfig.privateKey,
        clientEmail: firebaseConfig.clientEmail,
      }),
      projectId: firebaseConfig.projectId,
    });
    
    logWithTimestamp('✅ Firebase Admin SDK initialized successfully');
  } else {
    logWithTimestamp('✅ Firebase Admin SDK already initialized');
  }
}

/**
 * Create a single test account
 */
async function createTestAccount(account: TestAccount): Promise<TestAccountResult> {
  const startTime = Date.now();
  
  try {
    logWithTimestamp(`Creating account: ${account.email}`);
    
    // Create user in Firebase Auth
    const userRecord = await admin.auth().createUser({
      email: account.email,
      password: account.password,
      displayName: account.displayName,
      emailVerified: true, // Skip email verification for test accounts
    });
    
    // Create user profile in Firestore
    await admin.firestore().collection('users').doc(userRecord.uid).set({
      uid: userRecord.uid,
      email: account.email,
      displayName: account.displayName,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      songIds: [],
      taskIds: [],
      preferences: {
        favoriteStyles: [],
        language: 'ro'
      },
      // Additional fields that backend might expect
      isActive: true,
      subscriptionStatus: 'free',
      testMode: true
    });
    
    const duration = Date.now() - startTime;
    const result: TestAccountResult = {
      success: true,
      account: {
        ...account,
        uid: userRecord.uid,
        status: 'created',
        createdAt: new Date()
      },
      duration
    };
    
    logWithTimestamp(`✅ Created account: ${account.email} (${duration}ms)`);
    return result;
    
  } catch (error) {
    const duration = Date.now() - startTime;
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    logWithTimestamp(`❌ Failed to create account: ${account.email} - ${errorMessage}`, 'ERROR');
    
    return {
      success: false,
      account: {
        ...account,
        status: 'failed',
        error: errorMessage
      },
      error: errorMessage,
      duration
    };
  }
}

/**
 * Create test accounts with retry logic and batch processing
 */
async function createTestAccountsWithRetry(accounts: TestAccount[]): Promise<TestAccountResult[]> {
  const results: TestAccountResult[] = [];
  const batchSize = 10; // Process 10 accounts at a time
  const delayBetweenBatches = 1000; // 1 second delay between batches
  
  logWithTimestamp(`Starting creation of ${accounts.length} test accounts in batches of ${batchSize}`);
  
  for (let i = 0; i < accounts.length; i += batchSize) {
    const batch = accounts.slice(i, i + batchSize);
    const batchNumber = Math.floor(i / batchSize) + 1;
    const totalBatches = Math.ceil(accounts.length / batchSize);
    
    logWithTimestamp(`Processing batch ${batchNumber}/${totalBatches} (${batch.length} accounts)`);
    
    // Process batch concurrently
    const batchPromises = batch.map(account => 
      retryWithBackoff(() => createTestAccount(account), 2, 500)
    );
    
    const batchResults = await Promise.all(batchPromises);
    results.push(...batchResults);
    
    // Add delay between batches to avoid rate limiting
    if (i + batchSize < accounts.length) {
      logWithTimestamp(`Waiting ${delayBetweenBatches}ms before next batch...`);
      await sleep(delayBetweenBatches);
    }
  }
  
  return results;
}

/**
 * Save results to JSON file
 */
function saveResults(results: TestAccountResult[], filename: string): void {
  // Get test folder from environment variable
  const testFolder = process.env.STRESS_TEST_FOLDER || 'default';
  const outputDir = path.join(__dirname, '..', 'output', testFolder);
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }
  
  const filePath = path.join(outputDir, filename);
  fs.writeFileSync(filePath, JSON.stringify(results, null, 2));
  logWithTimestamp(`Results saved to: ${filePath}`);
}

/**
 * Generate summary report
 */
function generateSummaryReport(results: TestAccountResult[]): void {
  const total = results.length;
  const successful = results.filter(r => r.success).length;
  const failed = results.filter(r => !r.success).length;
  const successRate = Math.round((successful / total) * 100);
  
  const totalDuration = results.reduce((sum, r) => sum + r.duration, 0);
  const averageDuration = Math.round(totalDuration / total);
  
  const minDuration = Math.min(...results.map(r => r.duration));
  const maxDuration = Math.max(...results.map(r => r.duration));
  
  logWithTimestamp('='.repeat(50));
  logWithTimestamp('📊 ACCOUNT CREATION SUMMARY');
  logWithTimestamp('='.repeat(50));
  logWithTimestamp(`Total accounts: ${total}`);
  logWithTimestamp(`✅ Successful: ${successful} (${successRate}%)`);
  logWithTimestamp(`❌ Failed: ${failed} (${100 - successRate}%)`);
  logWithTimestamp(`⏱️  Average duration: ${averageDuration}ms`);
  logWithTimestamp(`⏱️  Min duration: ${minDuration}ms`);
  logWithTimestamp(`⏱️  Max duration: ${maxDuration}ms`);
  logWithTimestamp(`⏱️  Total duration: ${Math.round(totalDuration / 1000)}s`);
  
  if (failed > 0) {
    logWithTimestamp('\n❌ Failed accounts:');
    results.filter(r => !r.success).forEach(result => {
      logWithTimestamp(`  - ${result.account.email}: ${result.error}`, 'ERROR');
    });
  }
  
  logWithTimestamp('='.repeat(50));
}

/**
 * Main function to create test accounts
 */
async function main(): Promise<void> {
  try {
    logWithTimestamp('🚀 Starting test account creation process');
    
    // Initialize Firebase
    initializeFirebase();
    logWithTimestamp('✅ Firebase Admin SDK initialized');
    
    // Generate test accounts
    const accounts = generateTestAccounts(testConfig.accountsCount);
    logWithTimestamp(`📝 Generated ${accounts.length} test account configurations`);
    
    // Check if accounts already exist and use them
    logWithTimestamp('🔍 Checking for existing accounts...');
    const existingAccounts: string[] = [];
    const accountsToCreate: TestAccount[] = [];
    const results: TestAccountResult[] = [];
    
    for (const account of accounts) {
      try {
        const userRecord = await admin.auth().getUserByEmail(account.email);
        existingAccounts.push(account.email);
        logWithTimestamp(`✅ Found existing account: ${account.email}`);
        
        // Add existing account to results as successful
        results.push({
          success: true,
          account: {
            ...account,
            uid: userRecord.uid,
            status: 'existing',
            createdAt: new Date()
          },
          duration: 0
        });
      } catch (error) {
        // Account doesn't exist, add to creation list
        accountsToCreate.push(account);
      }
    }
    
    if (existingAccounts.length > 0) {
      logWithTimestamp(`✅ Found ${existingAccounts.length} existing accounts. Will use them for testing.`);
    }
    
    if (accountsToCreate.length > 0) {
      logWithTimestamp(`📝 Need to create ${accountsToCreate.length} new accounts.`);
    }
    
    // Create only new accounts
    let creationResults: TestAccountResult[] = [];
    if (accountsToCreate.length > 0) {
      const startTime = Date.now();
      creationResults = await createTestAccountsWithRetry(accountsToCreate);
      const totalTime = Date.now() - startTime;
      logWithTimestamp(`⏱️ Account creation took ${Math.round(totalTime / 1000)}s`);
    } else {
      logWithTimestamp('ℹ️ No new accounts to create, using existing ones.');
    }
    
    // Combine existing and newly created accounts
    const allResults = [...results, ...creationResults];
    
    // Generate summary
    generateSummaryReport(allResults);
    
    // Save results (timestamp is now in folder name)
    saveResults(allResults, 'test-accounts.json');
    
    // Save successful accounts for stress testing
    const successfulAccounts = allResults
      .filter(r => r.success)
      .map(r => r.account);
    
    if (successfulAccounts.length > 0) {
      saveResults(
        successfulAccounts.map(account => ({ success: true, account, duration: 0 })),
        'successful-accounts.json'
      );
      logWithTimestamp(`💾 Saved ${successfulAccounts.length} successful accounts for stress testing`);
    }
    
    logWithTimestamp(`🎉 Account setup completed - ${existingAccounts.length} existing + ${creationResults.length} new accounts`);
    
  } catch (error) {
    logWithTimestamp(`💥 Fatal error: ${error instanceof Error ? error.message : 'Unknown error'}`, 'ERROR');
    process.exit(1);
  }
}

// Run the script
if (require.main === module) {
  main().catch(error => {
    logWithTimestamp(`💥 Unhandled error: ${error.message}`, 'ERROR');
    process.exit(1);
  });
}

export { main as createTestAccounts };
