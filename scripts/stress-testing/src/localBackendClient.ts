import * as admin from 'firebase-admin';
import { localConfig, testConfig } from './config';
import { mockOpenAI, mockPayment, mockSuno } from './mockServices';
import { GenerationRequest, GenerationRequestStatus } from './types';
import { logWithTimestamp } from './utils';

/**
 * Client for local backend and emulator testing
 */
export class LocalBackendClient {
  private db: admin.firestore.Firestore | null = null;
  private isInitialized = false;

  constructor() {
    // Don't initialize Firestore here - wait for initialize() call
  }

  /**
   * Initialize connection to local emulator
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    try {
      logWithTimestamp('🔧 Initializing local backend client...');

      if (localConfig.useEmulator) {
        // Connect to local emulator
        process.env.FIRESTORE_EMULATOR_HOST = `${localConfig.emulatorHost}:${localConfig.emulatorPorts.firestore}`;
        process.env.FIREBASE_AUTH_EMULATOR_HOST = `${localConfig.emulatorHost}:${localConfig.emulatorPorts.auth}`;
        process.env.FIREBASE_FUNCTIONS_EMULATOR_HOST = `${localConfig.emulatorHost}:${localConfig.emulatorPorts.functions}`;
        
        logWithTimestamp(`✅ Connected to local emulator:`);
        logWithTimestamp(`   - Firestore: ${localConfig.emulatorHost}:${localConfig.emulatorPorts.firestore}`);
        logWithTimestamp(`   - Auth: ${localConfig.emulatorHost}:${localConfig.emulatorPorts.auth}`);
        logWithTimestamp(`   - Functions: ${localConfig.emulatorHost}:${localConfig.emulatorPorts.functions}`);
      } else {
        logWithTimestamp('⚠️ Using remote Firebase (not emulator)');
      }

      // Initialize Firestore database after emulator connection is set up
      this.db = admin.firestore();

      this.isInitialized = true;
      logWithTimestamp('✅ Local backend client initialized successfully');
      
    } catch (error) {
      logWithTimestamp(`❌ Failed to initialize local backend client: ${error instanceof Error ? error.message : 'Unknown error'}`, 'ERROR');
      throw error;
    }
  }

  /**
   * Get Firestore database instance
   */
  private getDb(): admin.firestore.Firestore {
    if (!this.db) {
      throw new Error('LocalBackendClient not initialized. Call initialize() first.');
    }
    return this.db;
  }

  /**
   * Create a complete generation request in the real collection
   */
  async createGenerationRequest(
    account: any,
    request: GenerationRequest
  ): Promise<{ success: boolean; requestId: string; error?: string }> {
    try {
      logWithTimestamp(`📝 Creating generation request for ${account.email}: "${request.title}"`);

      // Create the initial generation request document
      const generationRequest: any = {
        userId: account.uid || account.email,
        email: account.email,
        title: request.title,
        style: request.style,
        wantsDedication: request.wantsDedication,
        wantsDonation: request.wantsDonation,
        
        // Initial status
        status: 'pending',
        paymentStatus: 'pending',
        generationStarted: false,
        
        // Timestamps
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        
        // Test metadata
        testMode: true,
        testTimestamp: new Date().toISOString()
      };

      // Add optional fields only if they have values (not undefined)
      if (request.lyricsDetails) generationRequest.lyricsDetails = request.lyricsDetails;
      if (request.from) generationRequest.from = request.from;
      if (request.to) generationRequest.to = request.to;
      if (request.dedication) generationRequest.dedication = request.dedication;
      if (request.donorName) generationRequest.donorName = request.donorName;
      if (request.donationAmount) generationRequest.donationAmount = request.donationAmount;

      // Add to the real collection
      const collectionName = testConfig.testCollection;
      const docRef = await this.getDb().collection(collectionName).add(generationRequest);
      
      logWithTimestamp(`✅ Generation request created: ${docRef.id}`);
      
      return {
        success: true,
        requestId: docRef.id
      };

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logWithTimestamp(`❌ Failed to create generation request: ${errorMessage}`, 'ERROR');
      
      return {
        success: false,
        requestId: '',
        error: errorMessage
      };
    }
  }

  /**
   * Simulate payment success and trigger generation
   */
  async simulatePaymentSuccess(requestId: string): Promise<{ success: boolean; error?: string }> {
    try {
      logWithTimestamp(`💳 Simulating payment success for request: ${requestId}`);

      // Process mock payment
      const paymentResult = await mockPayment.processPayment(0, 'subscription_free');
      
      if (!paymentResult.success) {
        throw new Error('Payment simulation failed');
      }

      // Update the generation request with payment success
      await this.getDb().collection(testConfig.testCollection).doc(requestId).update({
        paymentStatus: 'success',
        paymentTransactionId: paymentResult.transactionId,
        paymentCompletedAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });

      logWithTimestamp(`✅ Payment success simulated for request: ${requestId}`);
      
      return { success: true };

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logWithTimestamp(`❌ Failed to simulate payment success: ${errorMessage}`, 'ERROR');
      
      return {
        success: false,
        error: errorMessage
      };
    }
  }

  /**
   * Start generation process (OpenAI + Suno)
   */
  async startGeneration(requestId: string, request: GenerationRequest): Promise<{ success: boolean; error?: string }> {
    try {
      logWithTimestamp(`🚀 Starting generation process for request: ${requestId}`);

      // Update status to generation started
      await this.getDb().collection(testConfig.testCollection).doc(requestId).update({
        generationStarted: true,
        generationStartedAt: admin.firestore.FieldValue.serverTimestamp(),
        status: 'generation_started',
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });

      // Step 1: Generate lyrics with OpenAI (mock)
      logWithTimestamp(`🤖 Step 1: Generating lyrics with OpenAI...`);
      const openaiStartTime = Date.now();
      
      const openaiResult = await mockOpenAI.generateLyrics(
        request.title,
        request.style,
        request.lyricsDetails
      );

      if (!openaiResult.success) {
        throw new Error(`OpenAI lyrics generation failed: ${openaiResult.error}`);
      }

      const openaiTime = Date.now() - openaiStartTime;
      
      // Update with OpenAI completion
      await this.getDb().collection(testConfig.testCollection).doc(requestId).update({
        openaiCompleted: true,
        openaiCompletedAt: admin.firestore.FieldValue.serverTimestamp(),
        generatedLyrics: openaiResult.lyrics,
        openaiGenerationTime: openaiTime,
        status: 'openai_complete',
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });

      logWithTimestamp(`✅ OpenAI lyrics generation completed (${openaiTime}ms)`);

      // Step 2: Generate music with Suno (mock)
      logWithTimestamp(`🎵 Step 2: Generating music with Suno...`);
      const sunoStartTime = Date.now();
      
      const sunoResult = await mockSuno.generateMusic(
        request.title,
        request.style,
        openaiResult.lyrics!
      );

      if (!sunoResult.success) {
        throw new Error(`Suno music generation failed: ${sunoResult.error}`);
      }

      const sunoTime = Date.now() - sunoStartTime;
      
      // Update with Suno completion
      await this.getDb().collection(testConfig.testCollection).doc(requestId).update({
        sunoCompleted: true,
        sunoCompletedAt: admin.firestore.FieldValue.serverTimestamp(),
        generatedAudioUrl: sunoResult.audioUrl,
        sunoGenerationTime: sunoTime,
        status: 'suno_complete',
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });

      logWithTimestamp(`✅ Suno music generation completed (${sunoTime}ms)`);

      // Step 3: Complete generation
      const totalGenerationTime = Date.now() - openaiStartTime;
      
      await this.getDb().collection(testConfig.testCollection).doc(requestId).update({
        generationCompleted: true,
        completedAt: admin.firestore.FieldValue.serverTimestamp(),
        status: 'generation_complete',
        totalGenerationTime: totalGenerationTime,
        downloadUrl: sunoResult.audioUrl,
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });

      logWithTimestamp(`🎉 Generation completed successfully for request: ${requestId}`);
      logWithTimestamp(`📊 Total generation time: ${totalGenerationTime}ms`);
      
      return { success: true };

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logWithTimestamp(`❌ Generation failed: ${errorMessage}`, 'ERROR');
      
      // Update status to failed
      await this.getDb().collection(testConfig.testCollection).doc(requestId).update({
        status: 'generation_failed',
        error: errorMessage,
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });
      
      return {
        success: false,
        error: errorMessage
      };
    }
  }

  /**
   * Get generation request status
   */
  async getGenerationStatus(requestId: string): Promise<GenerationRequestStatus | null> {
    try {
      const doc = await this.getDb().collection(testConfig.testCollection).doc(requestId).get();
      
      if (!doc.exists) {
        return null;
      }

      const data = doc.data()!;
      
      return {
        id: doc.id,
        status: data.status || 'pending',
        paymentStatus: data.paymentStatus || 'pending',
        generationStarted: data.generationStarted || false,
        generationStartedAt: data.generationStartedAt?.toDate(),
        openaiCompletedAt: data.openaiCompletedAt?.toDate(),
        sunoCompletedAt: data.sunoCompletedAt?.toDate(),
        completedAt: data.completedAt?.toDate(),
        downloadUrl: data.downloadUrl,
        error: data.error
      };

    } catch (error) {
      logWithTimestamp(`❌ Failed to get generation status: ${error instanceof Error ? error.message : 'Unknown error'}`, 'ERROR');
      return null;
    }
  }

  /**
   * Clean up test generation requests
   */
  async cleanupTestRequests(): Promise<{ success: boolean; deletedCount: number; error?: string }> {
    try {
      logWithTimestamp('🧹 Cleaning up test generation requests...');

      // Find all test requests
      const query = this.getDb().collection(testConfig.testCollection)
        .where('testMode', '==', true);
      
      const snapshot = await query.get();
      
      if (snapshot.empty) {
        logWithTimestamp('ℹ️ No test requests found to clean up');
        return { success: true, deletedCount: 0 };
      }

      // Delete in batches
      const batch = this.getDb().batch();
      snapshot.docs.forEach(doc => {
        batch.delete(doc.ref);
      });

      await batch.commit();
      
      logWithTimestamp(`✅ Cleaned up ${snapshot.size} test generation requests`);
      
      return {
        success: true,
        deletedCount: snapshot.size
      };

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logWithTimestamp(`❌ Failed to cleanup test requests: ${errorMessage}`, 'ERROR');
      
      return {
        success: false,
        deletedCount: 0,
        error: errorMessage
      };
    }
  }

  /**
   * Get test collection statistics
   */
  async getTestCollectionStats(): Promise<{ total: number; byStatus: { [key: string]: number } }> {
    try {
      const query = this.getDb().collection(testConfig.testCollection)
        .where('testMode', '==', true);
      
      const snapshot = await query.get();
      
      const byStatus: { [key: string]: number } = {};
      
      snapshot.docs.forEach(doc => {
        const status = doc.data().status || 'unknown';
        byStatus[status] = (byStatus[status] || 0) + 1;
      });

      return {
        total: snapshot.size,
        byStatus
      };

    } catch (error) {
      logWithTimestamp(`❌ Failed to get collection stats: ${error instanceof Error ? error.message : 'Unknown error'}`, 'ERROR');
      return { total: 0, byStatus: {} };
    }
  }
}
