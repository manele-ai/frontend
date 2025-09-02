import { PerformanceMetrics, StressTestResult } from './types';
import { calculatePercentage, formatDuration, logWithTimestamp } from './utils';

export class PerformanceMonitor {
  private results: StressTestResult[] = [];
  private startTime: Date | null = null;
  private endTime: Date | null = null;

  start(): void {
    this.startTime = new Date();
    logWithTimestamp('📊 Performance monitoring started');
  }

  stop(): void {
    this.endTime = new Date();
    logWithTimestamp('📊 Performance monitoring stopped');
  }

  addResult(result: StressTestResult): void {
    this.results.push(result);
  }

  getMetrics(): PerformanceMetrics {
    if (!this.startTime || !this.endTime) {
      throw new Error('Performance monitoring not started or stopped');
    }

    const totalRequests = this.results.length;
    const successfulRequests = this.results.filter(r => r.success).length;
    const failedRequests = totalRequests - successfulRequests;
    
    const responseTimes = this.results.map(r => r.responseTime);
    const averageResponseTime = responseTimes.reduce((sum, time) => sum + time, 0) / totalRequests;
    const minResponseTime = Math.min(...responseTimes);
    const maxResponseTime = Math.max(...responseTimes);
    
    const duration = this.endTime.getTime() - this.startTime.getTime();
    const requestsPerSecond = totalRequests / (duration / 1000);
    const errorRate = calculatePercentage(failedRequests, totalRequests);

    // Calculate generation flow specific metrics
    const successfulResults = this.results.filter(r => r.success);
    let averageOpenaiTime: number | undefined;
    let averageSunoTime: number | undefined;
    let averageTotalGenerationTime: number | undefined;

    if (successfulResults.length > 0) {
      // Calculate average total generation time
      const totalGenerationTimes = successfulResults
        .filter(r => r.totalGenerationTime !== undefined)
        .map(r => r.totalGenerationTime!);
      
      if (totalGenerationTimes.length > 0) {
        averageTotalGenerationTime = Math.round(
          totalGenerationTimes.reduce((sum, time) => sum + time, 0) / totalGenerationTimes.length
        );
      }

      // Note: OpenAI and Suno times are not directly tracked in current implementation
      // but could be added if needed for more detailed monitoring
    }

    return {
      totalRequests,
      successfulRequests,
      failedRequests,
      averageResponseTime: Math.round(averageResponseTime),
      minResponseTime,
      maxResponseTime,
      requestsPerSecond: Math.round(requestsPerSecond * 100) / 100,
      errorRate,
      startTime: this.startTime,
      endTime: this.endTime,
      duration,
      averageOpenaiTime,
      averageSunoTime,
      averageTotalGenerationTime
    };
  }

  printRealTimeStats(): void {
    const total = this.results.length;
    const successful = this.results.filter(r => r.success).length;
    const failed = total - successful;
    const successRate = total > 0 ? calculatePercentage(successful, total) : 0;

    if (total > 0) {
      const avgResponseTime = this.results.reduce((sum, r) => sum + r.responseTime, 0) / total;
      
      // Calculate generation flow stats
      const completedFlows = this.results.filter(r => r.stage === 'generation_complete').length;
      const avgGenerationTime = this.results
        .filter(r => r.totalGenerationTime !== undefined)
        .reduce((sum, r) => sum + (r.totalGenerationTime || 0), 0) / 
        this.results.filter(r => r.totalGenerationTime !== undefined).length;
      
      logWithTimestamp(`📈 Progress: ${total} requests | ✅ ${successful} (${successRate}%) | ❌ ${failed} | ⏱️ Avg: ${Math.round(avgResponseTime)}ms | 🎯 Complete flows: ${completedFlows} | ⏱️ Avg Gen: ${Math.round(avgGenerationTime)}ms`);
    }
  }

  printFinalReport(): void {
    const metrics = this.getMetrics();
    
    logWithTimestamp('='.repeat(60));
    logWithTimestamp('📊 COMPLETE GENERATION FLOW STRESS TEST REPORT');
    logWithTimestamp('='.repeat(60));
    logWithTimestamp(`🕐 Test Duration: ${formatDuration(metrics.duration)}`);
    logWithTimestamp(`📊 Total Requests: ${metrics.totalRequests}`);
    logWithTimestamp(`✅ Successful: ${metrics.successfulRequests} (${100 - metrics.errorRate}%)`);
    logWithTimestamp(`❌ Failed: ${metrics.failedRequests} (${metrics.errorRate}%)`);
    logWithTimestamp(`⚡ Requests/Second: ${metrics.requestsPerSecond}`);
    logWithTimestamp(`⏱️  Average Response Time: ${metrics.averageResponseTime}ms`);
    logWithTimestamp(`⏱️  Min Response Time: ${metrics.minResponseTime}ms`);
    logWithTimestamp(`⏱️  Max Response Time: ${metrics.maxResponseTime}ms`);
    
    // Generation flow specific metrics
    if (metrics.averageTotalGenerationTime) {
      logWithTimestamp(`🎯 Average Total Generation Time: ${metrics.averageTotalGenerationTime}ms`);
    }
    
    // Stage breakdown
    const stageBreakdown = this.getStageBreakdown();
    if (Object.keys(stageBreakdown).length > 0) {
      logWithTimestamp('\n📋 STAGE BREAKDOWN:');
      Object.entries(stageBreakdown).forEach(([stage, count]) => {
        const percentage = calculatePercentage(count, metrics.totalRequests);
        logWithTimestamp(`  ${stage}: ${count} (${percentage}%)`);
      });
    }
    
    // Performance assessment
    logWithTimestamp('\n🎯 PERFORMANCE ASSESSMENT:');
    if (metrics.errorRate < 5) {
      logWithTimestamp('✅ EXCELLENT - Error rate < 5%');
    } else if (metrics.errorRate < 10) {
      logWithTimestamp('⚠️  GOOD - Error rate < 10%');
    } else {
      logWithTimestamp('❌ NEEDS ATTENTION - Error rate > 10%');
    }

    if (metrics.averageResponseTime < 2000) {
      logWithTimestamp('✅ EXCELLENT - Average response time < 2s');
    } else if (metrics.averageResponseTime < 5000) {
      logWithTimestamp('⚠️  ACCEPTABLE - Average response time < 5s');
    } else {
      logWithTimestamp('❌ NEEDS OPTIMIZATION - Average response time > 5s');
    }

    if (metrics.requestsPerSecond > 1.5) {
      logWithTimestamp('✅ EXCELLENT - Throughput > 1.5 req/s');
    } else if (metrics.requestsPerSecond > 1.0) {
      logWithTimestamp('⚠️  ACCEPTABLE - Throughput > 1.0 req/s');
    } else {
      logWithTimestamp('❌ NEEDS INVESTIGATION - Throughput < 1.0 req/s');
    }

    // Generation flow specific assessment
    if (metrics.averageTotalGenerationTime) {
      if (metrics.averageTotalGenerationTime < 10000) {
        logWithTimestamp('✅ EXCELLENT - Generation time < 10s');
      } else if (metrics.averageTotalGenerationTime < 20000) {
        logWithTimestamp('⚠️  ACCEPTABLE - Generation time < 20s');
      } else {
        logWithTimestamp('❌ NEEDS OPTIMIZATION - Generation time > 20s');
      }
    }

    logWithTimestamp('='.repeat(60));
  }

  /**
   * Get breakdown of requests by stage
   */
  private getStageBreakdown(): { [key: string]: number } {
    const breakdown: { [key: string]: number } = {};
    
    this.results.forEach(result => {
      const stage = result.stage || 'unknown';
      breakdown[stage] = (breakdown[stage] || 0) + 1;
    });
    
    return breakdown;
  }

  getResults(): StressTestResult[] {
    return [...this.results];
  }

  getFailedRequests(): StressTestResult[] {
    return this.results.filter(r => !r.success);
  }

  getSuccessfulRequests(): StressTestResult[] {
    return this.results.filter(r => r.success);
  }

  /**
   * Get requests by stage
   */
  getRequestsByStage(stage: string): StressTestResult[] {
    return this.results.filter(r => r.stage === stage);
  }

  /**
   * Get completed generation flows
   */
  getCompletedFlows(): StressTestResult[] {
    return this.results.filter(r => r.stage === 'generation_complete');
  }

  clear(): void {
    this.results = [];
    this.startTime = null;
    this.endTime = null;
  }
}
