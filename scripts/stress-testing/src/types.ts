// Types for stress testing

export interface TestAccount {
  email: string;
  password: string;
  uid?: string;
  displayName: string;
  createdAt?: Date;
  status: 'created' | 'failed' | 'pending' | 'existing';
  error?: string;
}

export interface TestAccountResult {
  success: boolean;
  account: TestAccount;
  error?: string;
  duration: number;
}

export interface StressTestConfig {
  maxConcurrentRequests: number;
  requestsPerSecond: number;
  testDurationSeconds: number;
  testAccounts: TestAccount[];
}

export interface GenerationRequest {
  title: string;
  lyricsDetails?: string;
  style: string;
  wantsDedication: boolean;
  from?: string;
  to?: string;
  dedication?: string;
  wantsDonation: boolean;
  donorName?: string;
  donationAmount?: number;
}

export interface StressTestResult {
  requestId: string;
  accountEmail: string;
  success: boolean;
  responseTime: number;
  error?: string;
  timestamp: Date;
}

export interface PerformanceMetrics {
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  averageResponseTime: number;
  minResponseTime: number;
  maxResponseTime: number;
  requestsPerSecond: number;
  errorRate: number;
  startTime: Date;
  endTime: Date;
  duration: number;
}

export interface FirebaseConfig {
  projectId: string;
  privateKey: string;
  clientEmail: string;
}

export interface StagingConfig {
  functionsUrl: string;
  frontendUrl: string;
  projectId: string;
}
