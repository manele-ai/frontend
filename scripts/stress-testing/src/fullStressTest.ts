import { spawn } from 'child_process';
import { config } from 'dotenv';
import { logWithTimestamp } from './utils';

// Load environment variables
config();

/**
 * Master script that runs the complete stress testing workflow:
 * 1. Create test accounts
 * 2. Run stress test
 * 3. Clean up test accounts
 */
class FullStressTestRunner {
  private requestCount: number;
  private totalStartTime: number = 0;
  private testFolder: string;

  constructor(requestCount: number = 10) {
    this.requestCount = requestCount;
    // Create timestamped test folder
    const now = new Date();
    const dateStr = now.toISOString().slice(0, 10); // YYYY-MM-DD
    const timeStr = now.toTimeString().slice(0, 8).replace(/:/g, '-'); // HH-MM-SS
    this.testFolder = `test-${dateStr}_${timeStr}`;
  }

  /**
   * Run a command and wait for completion
   */
  private async runCommand(command: string, args: string[] = []): Promise<boolean> {
    return new Promise((resolve) => {
      logWithTimestamp(`🚀 Running: ${command} ${args.join(' ')}`);
      
      const child = spawn('npm', ['run', command, ...args], {
        stdio: 'inherit',
        shell: true,
        env: {
          ...process.env,
          STRESS_TEST_FOLDER: this.testFolder
        }
      });

      child.on('close', (code) => {
        if (code === 0) {
          logWithTimestamp(`✅ Command completed successfully: ${command}`);
          resolve(true);
        } else {
          logWithTimestamp(`❌ Command failed with code ${code}: ${command}`, 'ERROR');
          resolve(false);
        }
      });

      child.on('error', (error) => {
        logWithTimestamp(`❌ Command error: ${error.message}`, 'ERROR');
        resolve(false);
      });
    });
  }

  /**
   * Display final performance summary from the latest stress test results
   */
  private async displayFinalSummary(): Promise<void> {
    try {
      const fs = require('fs');
      const path = require('path');
      
      // Find the performance report in the test folder
      const outputDir = path.join('./output', this.testFolder);
      if (!fs.existsSync(outputDir)) {
        logWithTimestamp('⚠️ No test folder found for performance summary', 'WARN');
        return;
      }

      const reportPath = path.join(outputDir, 'performance-report.json');
      
      if (!fs.existsSync(reportPath)) {
        logWithTimestamp('⚠️ No performance report found for summary', 'WARN');
        return;
      }
      
      const reportData = JSON.parse(fs.readFileSync(reportPath, 'utf8'));
      
      logWithTimestamp('\n📊 FINAL PERFORMANCE SUMMARY');
      logWithTimestamp('============================================================');
      logWithTimestamp(`📈 Test Results from: ${this.testFolder}/performance-report.json`);
      logWithTimestamp('============================================================');
      logWithTimestamp(`📊 Total Requests: ${reportData.totalRequests}`);
      logWithTimestamp(`✅ Successful: ${reportData.successfulRequests} (${((reportData.successfulRequests / reportData.totalRequests) * 100).toFixed(1)}%)`);
      logWithTimestamp(`❌ Failed: ${reportData.failedRequests} (${reportData.errorRate.toFixed(1)}%)`);
      logWithTimestamp(`⚡ Requests/Second: ${reportData.requestsPerSecond.toFixed(2)}`);
      logWithTimestamp(`⏱️  Average Response Time: ${reportData.averageResponseTime.toFixed(0)}ms`);
      logWithTimestamp(`⏱️  Min Response Time: ${reportData.minResponseTime.toFixed(0)}ms`);
      logWithTimestamp(`⏱️  Max Response Time: ${reportData.maxResponseTime.toFixed(0)}ms`);
      logWithTimestamp(`🕐 Test Duration: ${Math.round(reportData.duration / 1000)}s`);
      logWithTimestamp('============================================================');
      
      // Performance assessment
      logWithTimestamp('\n🎯 PERFORMANCE ASSESSMENT:');
      if (reportData.errorRate < 5) {
        logWithTimestamp('✅ EXCELLENT - Error rate < 5%');
      } else if (reportData.errorRate < 10) {
        logWithTimestamp('⚠️ GOOD - Error rate < 10%');
      } else {
        logWithTimestamp('❌ NEEDS ATTENTION - Error rate > 10%');
      }
      
      if (reportData.averageResponseTime < 2000) {
        logWithTimestamp('✅ EXCELLENT - Average response time < 2s');
      } else if (reportData.averageResponseTime < 5000) {
        logWithTimestamp('⚠️ ACCEPTABLE - Average response time < 5s');
      } else {
        logWithTimestamp('❌ NEEDS OPTIMIZATION - Average response time > 5s');
      }
      
      if (reportData.requestsPerSecond > 1.5) {
        logWithTimestamp('✅ EXCELLENT - Throughput > 1.5 req/s');
      } else if (reportData.requestsPerSecond > 1.0) {
        logWithTimestamp('⚠️ ACCEPTABLE - Throughput > 1.0 req/s');
      } else {
        logWithTimestamp('❌ NEEDS INVESTIGATION - Throughput < 1.0 req/s');
      }
      
      logWithTimestamp('============================================================');
      
      // Overall grade
      const errorScore = reportData.errorRate < 5 ? 3 : reportData.errorRate < 10 ? 2 : 1;
      const responseScore = reportData.averageResponseTime < 2000 ? 3 : reportData.averageResponseTime < 5000 ? 2 : 1;
      const throughputScore = reportData.requestsPerSecond > 1.5 ? 3 : reportData.requestsPerSecond > 1.0 ? 2 : 1;
      
      const totalScore = errorScore + responseScore + throughputScore;
      const grade = totalScore >= 8 ? 'A' : totalScore >= 6 ? 'B' : totalScore >= 4 ? 'C' : 'D';
      
      logWithTimestamp(`\n🏆 OVERALL GRADE: ${grade} (${totalScore}/9)`);
      
      if (grade === 'A') {
        logWithTimestamp('🎉 OUTSTANDING! Your application is performing excellently!');
      } else if (grade === 'B') {
        logWithTimestamp('👍 GOOD! Your application is performing well with minor optimizations possible.');
      } else if (grade === 'C') {
        logWithTimestamp('⚠️ FAIR! Consider optimizing performance for better user experience.');
      } else {
        logWithTimestamp('❌ NEEDS WORK! Significant performance improvements required.');
      }
      
      logWithTimestamp('============================================================');
      
      // Save final summary to file
      this.saveFinalSummary(reportData, grade, totalScore);
      
    } catch (error) {
      logWithTimestamp(`⚠️ Could not display performance summary: ${error instanceof Error ? error.message : 'Unknown error'}`, 'WARN');
    }
  }

  /**
   * Save final summary to a timestamped file
   */
  private saveFinalSummary(reportData: any, grade: string, totalScore: number): void {
    try {
      const fs = require('fs');
      const path = require('path');
      
      const outputDir = path.join('./output', this.testFolder);
      if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
      }
      
      const now = new Date();
      
      const finalSummary = {
        timestamp: now.toISOString(),
        testFolder: this.testFolder,
        summary: {
          totalRequests: reportData.totalRequests,
          successfulRequests: reportData.successfulRequests,
          failedRequests: reportData.failedRequests,
          successRate: ((reportData.successfulRequests / reportData.totalRequests) * 100).toFixed(1) + '%',
          errorRate: reportData.errorRate.toFixed(1) + '%',
          requestsPerSecond: reportData.requestsPerSecond.toFixed(2),
          averageResponseTime: reportData.averageResponseTime.toFixed(0) + 'ms',
          minResponseTime: reportData.minResponseTime.toFixed(0) + 'ms',
          maxResponseTime: reportData.maxResponseTime.toFixed(0) + 'ms',
          testDuration: Math.round(reportData.duration / 1000) + 's'
        },
        performance: {
          overallGrade: grade,
          totalScore: `${totalScore}/9`,
          assessment: {
            errorRate: reportData.errorRate < 5 ? 'EXCELLENT' : reportData.errorRate < 10 ? 'GOOD' : 'NEEDS ATTENTION',
            responseTime: reportData.averageResponseTime < 2000 ? 'EXCELLENT' : reportData.averageResponseTime < 5000 ? 'ACCEPTABLE' : 'NEEDS OPTIMIZATION',
            throughput: reportData.requestsPerSecond > 1.5 ? 'EXCELLENT' : reportData.requestsPerSecond > 1.0 ? 'ACCEPTABLE' : 'NEEDS INVESTIGATION'
          }
        }
      };
      
      const filename = 'full-test-summary.json';
      const filePath = path.join(outputDir, filename);
      fs.writeFileSync(filePath, JSON.stringify(finalSummary, null, 2));
      logWithTimestamp(`💾 Final summary saved to: ${filePath}`);
      
    } catch (error) {
      logWithTimestamp(`❌ Failed to save final summary: ${error instanceof Error ? error.message : 'Unknown error'}`, 'ERROR');
    }
  }

  /**
   * Run the complete stress testing workflow
   */
  public async runFullTest(): Promise<void> {
    this.totalStartTime = Date.now();
    
    logWithTimestamp('🎯 Starting Full Stress Test Workflow');
    logWithTimestamp('============================================================');
    logWithTimestamp(`📊 Target: ${this.requestCount} concurrent requests`);
    logWithTimestamp(`📁 Test Folder: ${this.testFolder}`);
    logWithTimestamp('============================================================');

    let step = 1;
    const totalSteps = 3;

    try {
      // Step 1: Create test accounts
      logWithTimestamp(`\n📝 STEP ${step}/${totalSteps}: Creating test accounts...`);
      logWithTimestamp('============================================================');
      
      const createSuccess = await this.runCommand('create-accounts');
      if (!createSuccess) {
        throw new Error('Failed to create test accounts');
      }
      
      step++;
      logWithTimestamp('✅ Test accounts created successfully');

      // Step 2: Run stress test
      logWithTimestamp(`\n🚀 STEP ${step}/${totalSteps}: Running stress test...`);
      logWithTimestamp('============================================================');
      
      const stressSuccess = await this.runCommand('stress-test', [this.requestCount.toString()]);
      if (!stressSuccess) {
        logWithTimestamp('⚠️ Stress test had issues, but continuing with cleanup...', 'WARN');
      } else {
        logWithTimestamp('✅ Stress test completed successfully');
      }
      
      step++;

      // Step 3: Clean up test accounts
      logWithTimestamp(`\n🧹 STEP ${step}/${totalSteps}: Cleaning up test accounts...`);
      logWithTimestamp('============================================================');
      
      const cleanupSuccess = await this.runCommand('clean-accounts');
      if (!cleanupSuccess) {
        logWithTimestamp('⚠️ Cleanup had issues, but test is complete', 'WARN');
      } else {
        logWithTimestamp('✅ Test accounts cleaned up successfully');
      }

      // Final summary
      const totalDuration = Date.now() - this.totalStartTime;
      const minutes = Math.floor(totalDuration / 60000);
      const seconds = Math.floor((totalDuration % 60000) / 1000);
      
      logWithTimestamp('\n🎉 FULL STRESS TEST WORKFLOW COMPLETED');
      logWithTimestamp('============================================================');
      logWithTimestamp(`⏱️  Total Duration: ${minutes}m ${seconds}s`);
      logWithTimestamp(`📊 Requests Tested: ${this.requestCount}`);
      logWithTimestamp(`✅ Accounts Created: ✓`);
      logWithTimestamp(`🚀 Stress Test: ${stressSuccess ? '✓' : '⚠️'}`);
      logWithTimestamp(`🧹 Cleanup: ${cleanupSuccess ? '✓' : '⚠️'}`);
      logWithTimestamp('============================================================');
      
      // Display final performance summary
      await this.displayFinalSummary();
      
      if (stressSuccess && cleanupSuccess) {
        logWithTimestamp('🎯 All steps completed successfully!');
        process.exit(0);
      } else {
        logWithTimestamp('⚠️ Some steps had issues, but workflow completed', 'WARN');
        process.exit(1);
      }

    } catch (error) {
      const totalDuration = Date.now() - this.totalStartTime;
      logWithTimestamp(`\n💥 FULL STRESS TEST WORKFLOW FAILED`);
      logWithTimestamp('============================================================');
      logWithTimestamp(`⏱️  Duration before failure: ${Math.round(totalDuration / 1000)}s`);
      logWithTimestamp(`❌ Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      logWithTimestamp('============================================================');
      
      // Try to cleanup even if there was an error
      logWithTimestamp('\n🧹 Attempting emergency cleanup...');
      await this.runCommand('clean-accounts');
      
      process.exit(1);
    }
  }
}

/**
 * Main execution
 */
async function main() {
  // Parse command line arguments
  const args = process.argv.slice(2);
  const requestCount = args[0] ? parseInt(args[0], 10) : 10;
  
  if (isNaN(requestCount) || requestCount < 1) {
    logWithTimestamp('❌ Invalid request count. Please provide a positive number.', 'ERROR');
    logWithTimestamp('Usage: npm run full-test [requestCount]');
    logWithTimestamp('Example: npm run full-test 50');
    process.exit(1);
  }

  if (requestCount > 100) {
    logWithTimestamp('⚠️ Warning: Request count > 100 may cause rate limiting issues', 'WARN');
  }

  const runner = new FullStressTestRunner(requestCount);
  await runner.runFullTest();
}

// Run the full test
if (require.main === module) {
  main().catch(error => {
    logWithTimestamp(`💥 Unhandled error: ${error.message}`, 'ERROR');
    process.exit(1);
  });
}

export { FullStressTestRunner };
