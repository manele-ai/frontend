import * as admin from 'firebase-admin';
import * as fs from 'fs';
import * as path from 'path';
import { firebaseConfig, testConfig } from './config';
import { PerformanceMonitor } from './performanceMonitor';
import { TestDataGenerator } from './testDataGenerator';
import { GenerationRequest, StressTestResult, TestAccount } from './types';
import { logWithTimestamp, retryWithBackoff, sleep } from './utils';

// Initialize Firebase Admin SDK
if (admin.apps.length === 0) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: firebaseConfig.projectId,
      privateKey: firebaseConfig.privateKey,
      clientEmail: firebaseConfig.clientEmail,
    }),
    projectId: firebaseConfig.projectId,
  });
}

class StressTester {
  private performanceMonitor: PerformanceMonitor;
  private testDataGenerator: TestDataGenerator;
  private testAccounts: TestAccount[] = [];
  private isRunning = false;

  constructor() {
    this.performanceMonitor = new PerformanceMonitor();
    this.testDataGenerator = new TestDataGenerator();
  }

  /**
   * Initialize Firebase Admin SDK
   */
  private async initializeFirebase(): Promise<void> {
    try {
      logWithTimestamp('🔧 Initializing Firebase Admin SDK...');
      
      // Firebase Admin SDK is already initialized at module level
      logWithTimestamp('✅ Firebase Admin SDK initialized successfully');
    } catch (error) {
      logWithTimestamp(`❌ Failed to initialize Firebase: ${error instanceof Error ? error.message : 'Unknown error'}`, 'ERROR');
      throw error;
    }
  }

  /**
   * Load test accounts from successful accounts file
   */
  private async loadTestAccounts(): Promise<void> {
    try {
      logWithTimestamp('📂 Loading test accounts...');
      
      const outputDir = path.join(__dirname, '..', 'output');
      const files = fs.readdirSync(outputDir);
      const successfulAccountsFile = files.find(file => file.startsWith('successful-accounts-'));
      
      if (!successfulAccountsFile) {
        throw new Error('No successful accounts file found. Run create-accounts first.');
      }
      
      const filePath = path.join(outputDir, successfulAccountsFile);
      const fileContent = fs.readFileSync(filePath, 'utf-8');
      const results = JSON.parse(fileContent);
      
      this.testAccounts = results
        .filter((result: any) => result.success)
        .map((result: any) => result.account);
      
      logWithTimestamp(`✅ Loaded ${this.testAccounts.length} test accounts`);
      
      if (this.testAccounts.length === 0) {
        throw new Error('No valid test accounts found');
      }
    } catch (error) {
      logWithTimestamp(`❌ Failed to load test accounts: ${error instanceof Error ? error.message : 'Unknown error'}`, 'ERROR');
      throw error;
    }
  }

  /**
   * Generate custom token for test account using Admin SDK
   */
  private async generateCustomToken(account: TestAccount): Promise<string> {
    try {
      // Create custom token for the test account
      const customToken = await admin.auth().createCustomToken(account.uid || account.email);
      return customToken;
    } catch (error) {
      logWithTimestamp(`❌ Failed to generate custom token for ${account.email}: ${error instanceof Error ? error.message : 'Unknown error'}`, 'ERROR');
      throw error;
    }
  }

  /**
   * Simulate a generation request by directly creating data in Firestore
   * This bypasses Cloud Functions and App Check for stress testing
   */
  private async makeGenerationRequest(
    account: TestAccount, 
    request: GenerationRequest
  ): Promise<StressTestResult> {
    const startTime = Date.now();
    const requestId = `stress-test-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    try {
      // Simulate the generation request by creating a test document in Firestore
      // This tests the database performance without going through Cloud Functions
      
      // Create document with only defined values to avoid Firestore undefined errors
      const testDoc: any = {
        requestId,
        userId: account.uid || account.email,
        email: account.email,
        title: request.title,
        style: request.style,
        wantsDedication: request.wantsDedication,
        wantsDonation: request.wantsDonation,
        status: 'test_request',
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        testMode: true
      };
      
      // Only add optional fields if they have values
      if (request.lyricsDetails) testDoc.lyricsDetails = request.lyricsDetails;
      if (request.from) testDoc.from = request.from;
      if (request.to) testDoc.to = request.to;
      if (request.dedication) testDoc.dedication = request.dedication;
      if (request.donorName) testDoc.donorName = request.donorName;
      if (request.donationAmount) testDoc.donationAmount = request.donationAmount;
      
      // Write to a test collection to simulate the request
      await admin.firestore()
        .collection('stress_test_requests')
        .doc(requestId)
        .set(testDoc);
      
      const responseTime = Date.now() - startTime;
      
      const stressResult: StressTestResult = {
        requestId,
        accountEmail: account.email,
        success: true,
        responseTime,
        timestamp: new Date()
      };
      
      logWithTimestamp(`✅ Request successful: ${account.email} (${responseTime}ms)`);
      return stressResult;
      
    } catch (error) {
      const responseTime = Date.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      const stressResult: StressTestResult = {
        requestId,
        accountEmail: account.email,
        success: false,
        responseTime,
        error: errorMessage,
        timestamp: new Date()
      };
      
      logWithTimestamp(`❌ Request failed: ${account.email} - ${errorMessage} (${responseTime}ms)`, 'ERROR');
      return stressResult;
    }
  }

  /**
   * Run stress test with specified number of requests
   */
  private async runStressTest(requestCount: number): Promise<void> {
    logWithTimestamp(`🚀 Starting stress test with ${requestCount} requests`);
    
    this.performanceMonitor.start();
    this.isRunning = true;
    
    const requests: Promise<StressTestResult>[] = [];
    let completedRequests = 0;
    
    // Generate test requests
    const testRequests = this.testDataGenerator.generateMultipleRequests(requestCount);
    
    // Distribute requests across test accounts
    for (let i = 0; i < requestCount; i++) {
      const accountIndex = i % this.testAccounts.length;
      const account = this.testAccounts[accountIndex];
      const request = testRequests[i];
      
      // Add delay to respect rate limits (2 requests per second)
      if (i > 0 && i % 2 === 0) {
        await sleep(1000); // Wait 1 second every 2 requests
      }
      
      // Make request with retry logic
      const requestPromise = retryWithBackoff(
        () => this.makeGenerationRequest(account, request),
        2, // Max 2 retries
        1000 // Base delay 1 second
      );
      
      requests.push(requestPromise);
      
      // Show progress every 10 requests
      if ((i + 1) % 10 === 0) {
        logWithTimestamp(`📊 Progress: ${i + 1}/${requestCount} requests queued`);
      }
    }
    
    // Wait for all requests to complete
    logWithTimestamp('⏳ Waiting for all requests to complete...');
    
    const results = await Promise.allSettled(requests);
    
    // Process results
    results.forEach((result, index) => {
      if (result.status === 'fulfilled') {
        this.performanceMonitor.addResult(result.value);
        completedRequests++;
      } else {
        logWithTimestamp(`❌ Request ${index + 1} failed: ${result.reason}`, 'ERROR');
      }
      
      // Show progress every 10 completed requests
      if (completedRequests % 10 === 0) {
        this.performanceMonitor.printRealTimeStats();
      }
    });
    
    this.performanceMonitor.stop();
    this.isRunning = false;
    
    logWithTimestamp(`🎉 Stress test completed: ${completedRequests}/${requestCount} requests processed`);
  }

  /**
   * Save results to file
   */
  private saveResults(): void {
    try {
      const outputDir = path.join(__dirname, '..', 'output');
      if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
      }
      
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const resultsFile = path.join(outputDir, `stress-test-results-${timestamp}.json`);
      const metricsFile = path.join(outputDir, `performance-report-${timestamp}.json`);
      
      // Save detailed results
      const results = this.performanceMonitor.getResults();
      fs.writeFileSync(resultsFile, JSON.stringify(results, null, 2));
      logWithTimestamp(`💾 Results saved to: ${resultsFile}`);
      
      // Save performance metrics
      const metrics = this.performanceMonitor.getMetrics();
      fs.writeFileSync(metricsFile, JSON.stringify(metrics, null, 2));
      logWithTimestamp(`📊 Performance report saved to: ${metricsFile}`);
      
    } catch (error) {
      logWithTimestamp(`❌ Failed to save results: ${error instanceof Error ? error.message : 'Unknown error'}`, 'ERROR');
    }
  }

  /**
   * Main method to run the stress test
   */
  async run(requestCount: number = testConfig.maxConcurrentRequests): Promise<void> {
    try {
      logWithTimestamp('🚀 Starting Manele AI Stress Test');
      
      // Validate request count
      if (requestCount > 100) {
        throw new Error('Request count cannot exceed 100');
      }
      
      if (requestCount < 1) {
        throw new Error('Request count must be at least 1');
      }
      
      // Initialize Firebase
      await this.initializeFirebase();
      
      // Load test accounts
      await this.loadTestAccounts();
      
      // Run stress test
      await this.runStressTest(requestCount);
      
      // Print final report
      this.performanceMonitor.printFinalReport();
      
      // Save results
      this.saveResults();
      
      logWithTimestamp('🎉 Stress test completed successfully!');
      
    } catch (error) {
      logWithTimestamp(`💥 Stress test failed: ${error instanceof Error ? error.message : 'Unknown error'}`, 'ERROR');
      throw error;
    }
  }

  /**
   * Stop the stress test
   */
  stop(): void {
    this.isRunning = false;
    logWithTimestamp('⏹️  Stress test stopped by user');
  }

  /**
   * Get current status
   */
  isTestRunning(): boolean {
    return this.isRunning;
  }
}

/**
 * Main function to run stress test
 */
async function main(): Promise<void> {
  const args = process.argv.slice(2);
  const requestCount = args[0] ? parseInt(args[0]) : testConfig.maxConcurrentRequests;
  
  const stressTester = new StressTester();
  
  // Handle graceful shutdown
  process.on('SIGINT', () => {
    logWithTimestamp('🛑 Received SIGINT, stopping stress test...');
    stressTester.stop();
    process.exit(0);
  });
  
  try {
    await stressTester.run(requestCount);
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

export { main as runStressTest, StressTester };


