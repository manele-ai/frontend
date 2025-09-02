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
  // Additional fields for complete flow testing
  stage?: 'created' | 'payment_success' | 'openai_complete' | 'suno_complete' | 'generation_complete';
  openaiTime?: number;
  sunoTime?: number;
  totalGenerationTime?: number;
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
  // Additional metrics for generation flow
  averageOpenaiTime?: number;
  averageSunoTime?: number;
  averageTotalGenerationTime?: number;
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

export interface LocalConfig {
  useEmulator: boolean;
  emulatorHost: string;
  emulatorPorts: {
    functions: number;
    firestore: number;
    auth: number;
    storage: number;
  };
  backendUrl: string;
  projectId: string;
}

// Mock service interfaces
export interface MockOpenAIResponse {
  success: boolean;
  lyrics?: string;
  error?: string;
  delay: number;
}

export interface MockSunoResponse {
  success: boolean;
  audioUrl?: string;
  error?: string;
  delay: number;
}

// Generation request status for testing
export interface GenerationRequestStatus {
  id: string;
  status: 'pending' | 'payment_success' | 'generation_started' | 'openai_complete' | 'suno_complete' | 'generation_complete';
  paymentStatus: 'pending' | 'success' | 'failed';
  generationStarted: boolean;
  generationStartedAt?: Date;
  openaiCompletedAt?: Date;
  sunoCompletedAt?: Date;
  completedAt?: Date;
  downloadUrl?: string;
  error?: string;
}
