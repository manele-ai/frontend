import { localConfig, stagingConfig } from './config';
import { LocalBackendClient } from './localBackendClient';
import { StagingBackendClient } from './stagingBackendClient';
import { logWithTimestamp } from './utils';

/**
 * Factory for creating the appropriate backend client based on environment
 */
export class BackendClientFactory {
  /**
   * Create the appropriate backend client based on configuration
   */
  static async createBackendClient(): Promise<LocalBackendClient | StagingBackendClient> {
    const useEmulator = localConfig.useEmulator;
    
    if (useEmulator) {
      logWithTimestamp('🏠 Creating LOCAL backend client (emulator)');
      const client = new LocalBackendClient();
      await client.initialize();
      return client;
    } else {
      logWithTimestamp('🌐 Creating STAGING backend client');
      const client = new StagingBackendClient();
      await client.initialize();
      return client;
    }
  }

  /**
   * Force creation of a specific backend client
   */
  static async createSpecificBackendClient(type: 'local' | 'staging'): Promise<LocalBackendClient | StagingBackendClient> {
    if (type === 'local') {
      logWithTimestamp('🏠 Creating LOCAL backend client (forced)');
      const client = new LocalBackendClient();
      await client.initialize();
      return client;
    } else {
      logWithTimestamp('🌐 Creating STAGING backend client (forced)');
      const client = new StagingBackendClient();
      await client.initialize();
      return client;
    }
  }

  /**
   * Get current environment info
   */
  static getEnvironmentInfo(): { type: 'local' | 'staging'; config: any } {
    if (localConfig.useEmulator) {
      return {
        type: 'local',
        config: {
          host: localConfig.emulatorHost,
          firestorePort: localConfig.emulatorPorts.firestore,
          authPort: localConfig.emulatorPorts.auth,
          functionsPort: localConfig.emulatorPorts.functions
        }
      };
    } else {
      return {
        type: 'staging',
        config: {
          functionsUrl: stagingConfig.functionsUrl,
          projectId: stagingConfig.projectId
        }
      };
    }
  }

  /**
   * Switch environment configuration
   */
  static switchEnvironment(type: 'local' | 'staging'): void {
    if (type === 'local') {
      process.env.USE_EMULATOR = 'true';
      process.env.EMULATOR_HOST = '127.0.0.1';
      process.env.EMULATOR_FIRESTORE_PORT = '8081';
      process.env.EMULATOR_AUTH_PORT = '9099';
      process.env.EMULATOR_FUNCTIONS_PORT = '5001';
      logWithTimestamp('🔄 Switched to LOCAL environment');
    } else {
      process.env.USE_EMULATOR = 'false';
      logWithTimestamp('🔄 Switched to STAGING environment');
    }
  }
}
