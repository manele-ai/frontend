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
      duration
    };
  }

  printRealTimeStats(): void {
    const total = this.results.length;
    const successful = this.results.filter(r => r.success).length;
    const failed = total - successful;
    const successRate = total > 0 ? calculatePercentage(successful, total) : 0;

    if (total > 0) {
      const avgResponseTime = this.results.reduce((sum, r) => sum + r.responseTime, 0) / total;
      logWithTimestamp(`📈 Progress: ${total} requests | ✅ ${successful} (${successRate}%) | ❌ ${failed} | ⏱️ Avg: ${Math.round(avgResponseTime)}ms`);
    }
  }

  printFinalReport(): void {
    const metrics = this.getMetrics();
    
    logWithTimestamp('='.repeat(60));
    logWithTimestamp('📊 STRESS TEST PERFORMANCE REPORT');
    logWithTimestamp('='.repeat(60));
    logWithTimestamp(`🕐 Test Duration: ${formatDuration(metrics.duration)}`);
    logWithTimestamp(`📊 Total Requests: ${metrics.totalRequests}`);
    logWithTimestamp(`✅ Successful: ${metrics.successfulRequests} (${100 - metrics.errorRate}%)`);
    logWithTimestamp(`❌ Failed: ${metrics.failedRequests} (${metrics.errorRate}%)`);
    logWithTimestamp(`⚡ Requests/Second: ${metrics.requestsPerSecond}`);
    logWithTimestamp(`⏱️  Average Response Time: ${metrics.averageResponseTime}ms`);
    logWithTimestamp(`⏱️  Min Response Time: ${metrics.minResponseTime}ms`);
    logWithTimestamp(`⏱️  Max Response Time: ${metrics.maxResponseTime}ms`);
    
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

    logWithTimestamp('='.repeat(60));
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

  clear(): void {
    this.results = [];
    this.startTime = null;
    this.endTime = null;
  }
}
