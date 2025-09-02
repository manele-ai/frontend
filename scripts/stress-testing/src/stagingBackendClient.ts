import { stagingConfig, testConfig } from './config';
import { GenerationRequest, GenerationRequestStatus } from './types';
import { logWithTimestamp, sleep } from './utils';

/**
 * Client for real backend testing (local or staging)
 * Makes HTTP requests to real backend with mock data
 */
export class StagingBackendClient {
  private baseUrl: string;
  private isInitialized = false;

  constructor() {
    this.baseUrl = stagingConfig.functionsUrl;
  }

  /**
   * Initialize connection to backend
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    try {
      logWithTimestamp('🌐 Initializing backend client...');
      logWithTimestamp(`   - Backend URL: ${this.baseUrl}`);
      logWithTimestamp(`   - Project ID: ${stagingConfig.projectId}`);
      
      // Test connection to backend
      const response = await fetch(`${this.baseUrl}/health`);
      if (!response.ok) {
        throw new Error(`Backend not responding: ${response.status}`);
      }
      
      this.isInitialized = true;
      logWithTimestamp('✅ Backend client initialized successfully');
      
    } catch (error) {
      logWithTimestamp(`❌ Failed to initialize backend client: ${error instanceof Error ? error.message : 'Unknown error'}`, 'ERROR');
      throw error;
    }
  }

  /**
   * Create a generation request via real backend
   */
  async createGenerationRequest(
    account: any,
    request: GenerationRequest
  ): Promise<{ success: boolean; requestId: string; error?: string }> {
    try {
      logWithTimestamp(`📝 Creating generation request via backend for ${account.email}: "${request.title}"`);

      const response = await fetch(`${this.baseUrl}/createGenerationRequest`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${account.idToken || 'test-token'}`,
        },
        body: JSON.stringify({
          title: request.title,
          style: request.style,
          lyricsDetails: request.lyricsDetails || '',
          wantsDedication: request.wantsDedication || false,
          wantsDonation: request.wantsDonation || false,
          from: request.from || '',
          to: request.to || '',
          dedication: request.dedication || '',
          donorName: request.donorName || '',
          donationAmount: request.donationAmount || 0,
          testMode: true,                    // ← Activează mock-urile în backend
          // Nu setăm paymentStatus aici - lăsăm backend-ul să proceseze
          mockData: {                        // ← Mock data pentru backend
            openaiDelay: testConfig.mockDelay.openai,
            sunoDelay: testConfig.mockDelay.suno
          }
        })
      });

      if (!response.ok) {
        const errorData = await response.text();
        throw new Error(`Backend API error: ${response.status} - ${errorData}`);
      }

      const result = await response.json() as { requestId: string };
      
      logWithTimestamp(`✅ Generation request created via backend: ${result.requestId}`);
      
      return {
        success: true,
        requestId: result.requestId
      };

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logWithTimestamp(`❌ Failed to create generation request via backend: ${errorMessage}`, 'ERROR');
      
      return {
        success: false,
        requestId: '',
        error: errorMessage
      };
    }
  }

  /**
   * Simulate payment success via backend
   */
  async simulatePaymentSuccess(requestId: string): Promise<{ success: boolean; error?: string }> {
    try {
      logWithTimestamp(`💳 Simulating payment success via backend for request: ${requestId}`);

      const response = await fetch(`${this.baseUrl}/simulatePaymentSuccess`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          requestId,
          testMode: true
        })
      });

      if (!response.ok) {
        const errorData = await response.text();
        throw new Error(`Backend API error: ${response.status} - ${errorData}`);
      }

      logWithTimestamp(`✅ Payment success simulated via backend for request: ${requestId}`);
      
      return { success: true };

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logWithTimestamp(`❌ Failed to simulate payment success via backend: ${errorMessage}`, 'ERROR');
      
      return {
        success: false,
        error: errorMessage
      };
    }
  }

  /**
   * Start generation process via backend
   */
  async startGeneration(requestId: string, request: GenerationRequest): Promise<{ success: boolean; error?: string }> {
    try {
      logWithTimestamp(`🚀 Starting generation process via backend for request: ${requestId}`);

      const response = await fetch(`${this.baseUrl}/startGeneration`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          requestId,
          testMode: true,
          mockData: {
            openaiDelay: testConfig.mockDelay.openai,
            sunoDelay: testConfig.mockDelay.suno
          }
        })
      });

      if (!response.ok) {
        const errorData = await response.text();
        throw new Error(`Backend API error: ${response.status} - ${errorData}`);
      }

      logWithTimestamp(`✅ Generation started via backend for request: ${requestId}`);
      
      return { success: true };

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logWithTimestamp(`❌ Failed to start generation via backend: ${errorMessage}`, 'ERROR');
      
      return {
        success: false,
        error: errorMessage
      };
    }
  }

  /**
   * Get generation request status via backend
   */
  async getGenerationStatus(requestId: string): Promise<GenerationRequestStatus | null> {
    try {
      const response = await fetch(`${this.baseUrl}/getGenerationStatus/${requestId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      if (!response.ok) {
        if (response.status === 404) {
          return null;
        }
        const errorData = await response.text();
        throw new Error(`Backend API error: ${response.status} - ${errorData}`);
      }

      const data = await response.json() as any;
      
      return {
        id: data.id,
        status: data.status || 'pending',
        paymentStatus: data.paymentStatus || 'pending',
        generationStarted: data.generationStarted || false,
        generationStartedAt: data.generationStartedAt ? new Date(data.generationStartedAt) : undefined,
        openaiCompletedAt: data.openaiCompletedAt ? new Date(data.openaiCompletedAt) : undefined,
        sunoCompletedAt: data.sunoCompletedAt ? new Date(data.sunoCompletedAt) : undefined,
        completedAt: data.completedAt ? new Date(data.completedAt) : undefined,
        downloadUrl: data.downloadUrl,
        error: data.error
      };

    } catch (error) {
      logWithTimestamp(`❌ Failed to get generation status via backend: ${error instanceof Error ? error.message : 'Unknown error'}`, 'ERROR');
      return null;
    }
  }

  /**
   * Wait for generation to complete via backend
   */
  async waitForGenerationComplete(requestId: string, maxWaitTime: number = 120000): Promise<{ success: boolean; error?: string }> {
    const startTime = Date.now();
    const checkInterval = 3000; // Check every 3 seconds
    
    logWithTimestamp(`⏳ Waiting for generation to complete via backend for request: ${requestId}`);
    
    while (Date.now() - startTime < maxWaitTime) {
      const status = await this.getGenerationStatus(requestId);
      
      if (!status) {
        await sleep(checkInterval);
        continue;
      }
      
      if (status.status === 'generation_complete') {
        logWithTimestamp(`✅ Generation completed via backend for request: ${requestId}`);
        return { success: true };
      }
      
      if (status.error) {
        logWithTimestamp(`❌ Generation failed via backend for request: ${requestId}: ${status.error}`);
        return { success: false, error: status.error };
      }
      
      // Log progress
      logWithTimestamp(`📊 Generation status via backend: ${status.status}`);
      
      await sleep(checkInterval);
    }
    
    const errorMessage = `Generation timeout after ${maxWaitTime / 1000}s`;
    logWithTimestamp(`⏰ ${errorMessage}`, 'ERROR');
    return { success: false, error: errorMessage };
  }

  /**
   * Clean up test generation requests via backend
   */
  async cleanupTestRequests(): Promise<{ success: boolean; deletedCount: number; error?: string }> {
    try {
      logWithTimestamp('🧹 Cleaning up test generation requests via backend...');

      const response = await fetch(`${this.baseUrl}/cleanupTestRequests`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          testMode: true
        })
      });

      if (!response.ok) {
        const errorData = await response.text();
        throw new Error(`Backend API error: ${response.status} - ${errorData}`);
      }

      const result = await response.json() as { deletedCount: number };
      
      logWithTimestamp(`✅ Cleaned up ${result.deletedCount} test requests via backend`);
      
      return {
        success: true,
        deletedCount: result.deletedCount
      };

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logWithTimestamp(`❌ Failed to cleanup test requests via backend: ${errorMessage}`, 'ERROR');
      
      return {
        success: false,
        deletedCount: 0,
        error: errorMessage
      };
    }
  }

  /**
   * Get test collection statistics via backend
   */
  async getTestCollectionStats(): Promise<{ total: number; byStatus: { [key: string]: number } }> {
    try {
      const response = await fetch(`${this.baseUrl}/getTestCollectionStats`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      if (!response.ok) {
        const errorData = await response.text();
        throw new Error(`Backend API error: ${response.status} - ${errorData}`);
      }

      const data = await response.json() as { total: number; byStatus: { [key: string]: number } };
      return data;

    } catch (error) {
      logWithTimestamp(`❌ Failed to get collection stats via backend: ${error instanceof Error ? error.message : 'Unknown error'}`, 'ERROR');
      return { total: 0, byStatus: {} };
    }
  }
}
