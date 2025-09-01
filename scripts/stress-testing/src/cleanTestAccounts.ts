import { config } from 'dotenv';
import * as admin from 'firebase-admin';
import * as fs from 'fs';
import { firebaseConfig } from './config';
import { TestAccount } from './types';
import { logWithTimestamp, sleep } from './utils';

// Load environment variables
config();

/**
 * Script to clean up test accounts created for stress testing
 * This will delete both Firebase Auth users and Firestore user documents
 */
class TestAccountCleaner {
  private accounts: TestAccount[] = [];

  constructor() {
    this.initializeFirebase();
  }

  /**
   * Initialize Firebase Admin SDK
   */
  private initializeFirebase(): void {
    try {
      if (!admin.apps.length) {
        admin.initializeApp({
          credential: admin.credential.cert({
            projectId: firebaseConfig.projectId,
            privateKey: firebaseConfig.privateKey,
            clientEmail: firebaseConfig.clientEmail,
          }),
          projectId: firebaseConfig.projectId,
        });
      }
      logWithTimestamp('✅ Firebase Admin SDK initialized successfully');
    } catch (error) {
      logWithTimestamp(`❌ Failed to initialize Firebase Admin SDK: ${error instanceof Error ? error.message : 'Unknown error'}`, 'ERROR');
      throw error;
    }
  }

  /**
   * Load test accounts from file
   */
  private async loadTestAccounts(): Promise<void> {
    try {
      const outputDir = './output';
      
      if (!fs.existsSync(outputDir)) {
        logWithTimestamp('❌ No output directory found. Run create-accounts first.', 'ERROR');
        process.exit(1);
      }

      // Find the most recent test-accounts file
      const files = fs.readdirSync(outputDir)
        .filter(file => file.startsWith('test-accounts-') && file.endsWith('.json'))
        .sort()
        .reverse(); // Most recent first

      if (files.length === 0) {
        logWithTimestamp('⚠️ No test accounts file found, trying to clean up by email pattern...', 'WARN');
        await this.cleanupByEmailPattern();
        return;
      }

      const latestFile = files[0];
      const accountsPath = `${outputDir}/${latestFile}`;
      
      logWithTimestamp(`📂 Loading accounts from: ${latestFile}`);
      
      const accountsData = fs.readFileSync(accountsPath, 'utf8');
      const results = JSON.parse(accountsData);
      
      // Handle both TestAccount[] and TestAccountResult[] formats
      if (Array.isArray(results)) {
        if (results.length > 0 && results[0].account) {
          // TestAccountResult[] format
          this.accounts = results.map(result => result.account).filter(account => account && account.email);
        } else {
          // TestAccount[] format
          this.accounts = results.filter(account => account && account.email);
        }
      }
      
      logWithTimestamp(`✅ Loaded ${this.accounts.length} test accounts`);
    } catch (error) {
      logWithTimestamp(`❌ Failed to load test accounts: ${error instanceof Error ? error.message : 'Unknown error'}`, 'ERROR');
      throw error;
    }
  }

  /**
   * Delete a single test account
   */
  private async deleteTestAccount(account: TestAccount): Promise<boolean> {
    try {
      // Delete from Firebase Auth
      if (account.uid) {
        await admin.auth().deleteUser(account.uid);
        logWithTimestamp(`✅ Deleted Auth user: ${account.email}`);
      }

      // Delete from Firestore users collection
      const userDocRef = admin.firestore().collection('users').doc(account.uid || account.email);
      await userDocRef.delete();
      logWithTimestamp(`✅ Deleted Firestore user document: ${account.email}`);

      // Delete any stress test requests for this account
      const stressTestQuery = admin.firestore()
        .collection('stress_test_requests')
        .where('email', '==', account.email);
      
      const stressTestSnapshot = await stressTestQuery.get();
      if (!stressTestSnapshot.empty) {
        const batch = admin.firestore().batch();
        stressTestSnapshot.docs.forEach(doc => {
          batch.delete(doc.ref);
        });
        await batch.commit();
        logWithTimestamp(`✅ Deleted ${stressTestSnapshot.size} stress test requests for: ${account.email}`);
      }

      return true;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logWithTimestamp(`❌ Failed to delete account ${account.email}: ${errorMessage}`, 'ERROR');
      return false;
    }
  }

  /**
   * Clean up test accounts by email pattern when file is not available
   */
  private async cleanupByEmailPattern(): Promise<void> {
    logWithTimestamp('🔍 Searching for test accounts by email pattern...');
    
    try {
      // List all users and find test accounts
      const listUsersResult = await admin.auth().listUsers();
      const testAccounts = listUsersResult.users.filter(user => 
        user.email && user.email.startsWith('stress.test') && user.email.endsWith('@gmail.com')
      );
      
      if (testAccounts.length === 0) {
        logWithTimestamp('ℹ️ No test accounts found by email pattern');
        return;
      }
      
      logWithTimestamp(`🗑️ Found ${testAccounts.length} test accounts to delete...`);
      
      let successCount = 0;
      let failureCount = 0;
      
      for (let i = 0; i < testAccounts.length; i++) {
        const user = testAccounts[i];
        
        logWithTimestamp(`🔄 Processing account ${i + 1}/${testAccounts.length}: ${user.email}`);
        
        try {
          // Delete from Firebase Auth
          await admin.auth().deleteUser(user.uid);
          logWithTimestamp(`✅ Deleted Auth user: ${user.email}`);
          
          // Delete from Firestore users collection
          const userDocRef = admin.firestore().collection('users').doc(user.uid);
          await userDocRef.delete();
          logWithTimestamp(`✅ Deleted Firestore user document: ${user.email}`);
          
          // Delete any stress test requests for this account
          const stressTestQuery = admin.firestore()
            .collection('stress_test_requests')
            .where('email', '==', user.email);
          
          const stressTestSnapshot = await stressTestQuery.get();
          if (!stressTestSnapshot.empty) {
            const batch = admin.firestore().batch();
            stressTestSnapshot.docs.forEach(doc => {
              batch.delete(doc.ref);
            });
            await batch.commit();
            logWithTimestamp(`✅ Deleted ${stressTestSnapshot.size} stress test requests for: ${user.email}`);
          }
          
          successCount++;
          
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Unknown error';
          logWithTimestamp(`❌ Failed to delete account ${user.email}: ${errorMessage}`, 'ERROR');
          failureCount++;
        }
        
        // Rate limiting
        if (i < testAccounts.length - 1) {
          await sleep(100);
        }
      }
      
      // Summary
      logWithTimestamp('============================================================');
      logWithTimestamp('🧹 CLEANUP SUMMARY (By Email Pattern)');
      logWithTimestamp('============================================================');
      logWithTimestamp(`✅ Successfully deleted: ${successCount} accounts`);
      logWithTimestamp(`❌ Failed to delete: ${failureCount} accounts`);
      logWithTimestamp(`📊 Total processed: ${testAccounts.length} accounts`);
      
      if (failureCount === 0) {
        logWithTimestamp('🎉 All test accounts cleaned up successfully!');
      } else {
        logWithTimestamp(`⚠️ Some accounts could not be deleted. Check the logs above.`, 'WARN');
      }
      logWithTimestamp('============================================================');
      
    } catch (error) {
      logWithTimestamp(`❌ Failed to cleanup by email pattern: ${error instanceof Error ? error.message : 'Unknown error'}`, 'ERROR');
      throw error;
    }
  }

  /**
   * Clean up all test accounts
   */
  public async cleanAllAccounts(): Promise<void> {
    logWithTimestamp('🧹 Starting test account cleanup...');
    
    try {
      await this.loadTestAccounts();
    } catch (error) {
      logWithTimestamp('⚠️ Could not load test accounts file, trying to clean up by email pattern...', 'WARN');
      await this.cleanupByEmailPattern();
      return;
    }
    
    if (this.accounts.length === 0) {
      logWithTimestamp('ℹ️ No test accounts to clean up');
      return;
    }

    logWithTimestamp(`🗑️ Deleting ${this.accounts.length} test accounts...`);
    
    let successCount = 0;
    let failureCount = 0;

    // Process accounts with rate limiting (Firebase has limits)
    for (let i = 0; i < this.accounts.length; i++) {
      const account = this.accounts[i];
      
      logWithTimestamp(`🔄 Processing account ${i + 1}/${this.accounts.length}: ${account.email}`);
      
      const success = await this.deleteTestAccount(account);
      
      if (success) {
        successCount++;
      } else {
        failureCount++;
      }

      // Rate limiting - wait between deletions
      if (i < this.accounts.length - 1) {
        await sleep(100); // 100ms delay between deletions
      }
    }

    // Clean up the accounts file
    try {
      const outputDir = './output';
      const files = fs.readdirSync(outputDir)
        .filter(file => file.startsWith('test-accounts-') && file.endsWith('.json'));
      
      for (const file of files) {
        fs.unlinkSync(`${outputDir}/${file}`);
        logWithTimestamp(`✅ Deleted test accounts file: ${file}`);
      }
    } catch (error) {
      logWithTimestamp(`⚠️ Could not delete test accounts files: ${error instanceof Error ? error.message : 'Unknown error'}`, 'WARN');
    }

    // Summary
    logWithTimestamp('============================================================');
    logWithTimestamp('🧹 CLEANUP SUMMARY');
    logWithTimestamp('============================================================');
    logWithTimestamp(`✅ Successfully deleted: ${successCount} accounts`);
    logWithTimestamp(`❌ Failed to delete: ${failureCount} accounts`);
    logWithTimestamp(`📊 Total processed: ${this.accounts.length} accounts`);
    
    if (failureCount === 0) {
      logWithTimestamp('🎉 All test accounts cleaned up successfully!');
    } else {
      logWithTimestamp(`⚠️ Some accounts could not be deleted. Check the logs above.`, 'WARN');
    }
    logWithTimestamp('============================================================');
  }
}

/**
 * Main execution
 */
async function main() {
  try {
    const cleaner = new TestAccountCleaner();
    await cleaner.cleanAllAccounts();
  } catch (error) {
    logWithTimestamp(`❌ Cleanup failed: ${error instanceof Error ? error.message : 'Unknown error'}`, 'ERROR');
    process.exit(1);
  }
}

// Run the cleanup
main();
