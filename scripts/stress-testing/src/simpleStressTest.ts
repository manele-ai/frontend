import { config } from 'dotenv';
import * as admin from 'firebase-admin';
import * as fs from 'fs';
import * as path from 'path';
import { BackendClientFactory } from './backendClientFactory';
import { firebaseConfig, localConfig, testConfig } from './config';
import { PerformanceMonitor } from './performanceMonitor';
import { TestDataGenerator } from './testDataGenerator';
import { GenerationRequest, StressTestResult, TestAccount } from './types';
import { logWithTimestamp, retryWithBackoff, sleep } from './utils';

// Load environment variables first
config({ path: '.env_local' }); // Try local first
config(); // Then fallback to .env

class SimpleStressTester {
  private performanceMonitor: PerformanceMonitor;
  private testDataGenerator: TestDataGenerator;
  private backendClient: any; // Will be LocalBackendClient or StagingBackendClient
  private testAccounts: TestAccount[] = [];
  private isRunning = false;

  constructor() {
    this.performanceMonitor = new PerformanceMonitor();
    this.testDataGenerator = new TestDataGenerator();
  }

  /**
   * Initialize Firebase Admin SDK and backend client
   */
  private async initializeFirebase(): Promise<void> {
    try {
      logWithTimestamp('🔧 Initializing Firebase Admin SDK...');
      
      // Initialize Firebase Admin SDK if not already initialized
      if (admin.apps.length === 0) {
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
      
      // Initialize backend client (local or staging)
      this.backendClient = await BackendClientFactory.createBackendClient();
      
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
      
      // Get test folder from environment variable
      const testFolder = process.env.STRESS_TEST_FOLDER || 'default';
      const outputDir = path.join(__dirname, '..', 'output', testFolder);
      
      if (!fs.existsSync(outputDir)) {
        throw new Error('Test folder not found. Run create-accounts first.');
      }
      
      const filePath = path.join(outputDir, 'successful-accounts.json');
      
      if (!fs.existsSync(filePath)) {
        throw new Error('No successful accounts file found. Run create-accounts first.');
      }
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
   * Execute simple generation request creation (without triggering complex flow)
   */
  private async executeSimpleGenerationRequest(
    account: TestAccount, 
    request: GenerationRequest
  ): Promise<StressTestResult> {
    const startTime = Date.now();
    const requestId = `simple-test-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    try {
      logWithTimestamp(`🚀 Creating simple generation request for ${account.email}: "${request.title}"`);
      
      // Step 1: Create generation request in the real collection
      const createResult = await this.backendClient.createGenerationRequest(account, request);
      if (!createResult.success) {
        throw new Error(`Failed to create generation request: ${createResult.error}`);
      }
      
      const actualRequestId = createResult.requestId;
      logWithTimestamp(`✅ Generation request created: ${actualRequestId}`);
      
      // Step 2: Just wait a bit and get status (don't trigger complex flow)
      await sleep(2000); // Wait 2 seconds
      
      const status = await this.backendClient.getGenerationStatus(actualRequestId);
      if (!status) {
        throw new Error('Could not retrieve generation status');
      }
      
      const totalTime = Date.now() - startTime;
      
      // Create simple result
      const stressResult: StressTestResult = {
        requestId: actualRequestId,
        accountEmail: account.email,
        success: true,
        responseTime: totalTime,
        timestamp: new Date(),
        stage: 'created',
        totalGenerationTime: totalTime
      };
      
      logWithTimestamp(`🎉 Simple generation request successful: ${account.email} (${totalTime}ms)`);
      return stressResult;
      
    } catch (error) {
      const totalTime = Date.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      const stressResult: StressTestResult = {
        requestId,
        accountEmail: account.email,
        success: false,
        responseTime: totalTime,
        error: errorMessage,
        timestamp: new Date(),
        stage: 'created'
      };
      
      logWithTimestamp(`❌ Simple generation request failed: ${account.email} - ${errorMessage} (${totalTime}ms)`, 'ERROR');
      return stressResult;
    }
  }

  /**
   * Run simple stress test (only creates requests, doesn't trigger complex flow)
   */
  private async runSimpleStressTest(requestCount: number): Promise<void> {
    logWithTimestamp(`🚀 Starting simple generation request stress test with ${requestCount} requests`);
    
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
      
      // Add delay to respect rate limits (1 request per second)
      if (i > 0) {
        await sleep(1000); // Wait 1 second between requests
      }
      
      // Execute simple generation request with retry logic
      const requestPromise = retryWithBackoff(
        () => this.executeSimpleGenerationRequest(account, request),
        2, // Max 2 retries
        1000 // Base delay 1 second
      );
      
      requests.push(requestPromise);
      
      // Show progress every 5 requests
      if ((i + 1) % 5 === 0) {
        logWithTimestamp(`📊 Progress: ${i + 1}/${requestCount} requests queued`);
      }
    }
    
    // Wait for all requests to complete
    logWithTimestamp('⏳ Waiting for all generation requests to complete...');
    
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
    
    logWithTimestamp(`🎉 Simple generation request stress test completed: ${completedRequests}/${requestCount} requests processed`);
  }

  /**
   * Save results
   */
  private async saveResults(): Promise<void> {
    try {
      // Get test folder from environment variable
      const testFolder = process.env.STRESS_TEST_FOLDER || 'default';
      const outputDir = path.join(__dirname, '..', 'output', testFolder);
      if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
      }
      
      const resultsFile = path.join(outputDir, 'simple-stress-test-results.json');
      const metricsFile = path.join(outputDir, 'simple-performance-report.json');
      
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
   * Main method to run the simple generation request stress test
   */
  async run(requestCount: number = testConfig.maxConcurrentRequests): Promise<void> {
    try {
      logWithTimestamp('🚀 Starting Manele AI Simple Generation Request Stress Test');
      logWithTimestamp('============================================================');
      logWithTimestamp(`🎯 Testing simple flow: Request Creation Only (No Complex Flow)`);
      logWithTimestamp(`📊 Target requests: ${requestCount}`);
      logWithTimestamp(`🔧 Backend mode: ${localConfig.useEmulator ? 'Local' : 'Staging'}`);
      logWithTimestamp('============================================================');
      
      // Validate request count
      if (requestCount > 100) {
        throw new Error('Request count cannot exceed 100');
      }
      
      if (requestCount < 1) {
        throw new Error('Request count must be at least 1');
      }
      
      // Initialize Firebase and backend
      await this.initializeFirebase();
      
      // Load test accounts
      await this.loadTestAccounts();
      
      // Run simple generation request stress test
      await this.runSimpleStressTest(requestCount);
      
      // Print final report
      this.performanceMonitor.printFinalReport();
      
      // Save results
      await this.saveResults();
      
      logWithTimestamp('🎉 Simple generation request stress test completed successfully!');
      
    } catch (error) {
      logWithTimestamp(`💥 Simple generation request stress test failed: ${error instanceof Error ? error.message : 'Unknown error'}`, 'ERROR');
      throw error;
    }
  }

  /**
   * Stop the stress test
   */
  stop(): void {
    this.isRunning = false;
    logWithTimestamp('⏹️  Simple generation request stress test stopped by user');
  }

  /**
   * Get current status
   */
  isTestRunning(): boolean {
    return this.isRunning;
  }
}

/**
 * Main function to run simple generation request stress test
 */
async function main(): Promise<void> {
  const args = process.argv.slice(2);
  const requestCount = args[0] ? parseInt(args[0]) : testConfig.maxConcurrentRequests;
  
  const stressTester = new SimpleStressTester();
  
  // Handle graceful shutdown
  process.on('SIGINT', async () => {
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

export { main as runSimpleStressTest, SimpleStressTester };
