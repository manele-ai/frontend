import { testConfig } from './config';
import { MockOpenAIResponse, MockSunoResponse } from './types';
import { logWithTimestamp, sleep } from './utils';

/**
 * Mock OpenAI service that simulates lyrics generation
 */
export class MockOpenAIService {
  private static instance: MockOpenAIService;
  
  private constructor() {}
  
  static getInstance(): MockOpenAIService {
    if (!MockOpenAIService.instance) {
      MockOpenAIService.instance = new MockOpenAIService();
    }
    return MockOpenAIService.instance;
  }

  /**
   * Mock lyrics generation with realistic delay
   */
  async generateLyrics(
    title: string, 
    style: string, 
    lyricsDetails?: string
  ): Promise<MockOpenAIResponse> {
    const startTime = Date.now();
    
    try {
      logWithTimestamp(`🤖 Mock OpenAI: Generating lyrics for "${title}" (${style})`);
      
      // Simulate API call delay
      const delay = testConfig.mockDelay.openai;
      await sleep(delay);
      
      // Generate mock lyrics based on style
      const mockLyrics = this.generateMockLyrics(title, style, lyricsDetails);
      
      const responseTime = Date.now() - startTime;
      
      logWithTimestamp(`✅ Mock OpenAI: Lyrics generated successfully (${responseTime}ms)`);
      
      return {
        success: true,
        lyrics: mockLyrics,
        delay: responseTime
      };
      
    } catch (error) {
      const responseTime = Date.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      logWithTimestamp(`❌ Mock OpenAI: Failed to generate lyrics - ${errorMessage}`, 'ERROR');
      
      return {
        success: false,
        error: errorMessage,
        delay: responseTime
      };
    }
  }

  /**
   * Generate realistic mock lyrics based on style
   */
  private generateMockLyrics(title: string, style: string, lyricsDetails?: string): string {
    const styleLyrics = this.getStyleSpecificLyrics(style);
    const dedication = lyricsDetails ? `\n\n${lyricsDetails}` : '';
    
    return `[Strofa 1]
${title} - melodia mea
${styleLyrics.strofa1}${dedication}

[Refren]
${title} - cântecul meu
${styleLyrics.refren}

[Strofa 2]
${title} - visul meu
${styleLyrics.strofa2}

[Refren]
${title} - cântecul meu
${styleLyrics.refren}

[Final]
${title} - pentru tine
${styleLyrics.final}`;
  }

  /**
   * Get style-specific lyrics patterns
   */
  private getStyleSpecificLyrics(style: string): any {
    const lyricsPatterns: { [key: string]: any } = {
      'jale': {
        strofa1: 'In noaptea cea mai tristă\nCând inima-mi e goală',
        refren: 'Jale, jale, jale\nPentru dragostea pierdută',
        strofa2: 'Amintirile-mi sunt amare\nȘi sufletul-mi e rănit',
        final: 'Jale pentru tot ce-am avut'
      },
      'opulenta': {
        strofa1: 'În lumea opulenței\nUnde banii sunt stăpâni',
        refren: 'Opulență, opulență\nViața mea de lux',
        strofa2: 'Măsini scumpe și vile\nȘi toate plăcerile',
        final: 'Opulența mea de vis'
      },
      'manele-live': {
        strofa1: 'Pe scenă în fața publicului\nCând muzica pornește',
        refren: 'Live, live, live\nMuzica mea live',
        strofa2: 'Publicul cântă cu mine\nȘi atmosfera e perfectă',
        final: 'Live pentru toți fanii'
      },
      'trapanele': {
        strofa1: 'În ritmul trap-ului modern\nCu manelele clasice',
        refren: 'Trapanele, trapanele\nFuziunea perfectă',
        strofa2: 'Old school meets new school\nȘi rezultatul e magic',
        final: 'Trapanele pentru viitor'
      },
      'de-pahar': {
        strofa1: 'Cu paharul în mână\nCând prietenii sunt lângă mine',
        refren: 'De pahar, de pahar\nSărbătoarea prieteniei',
        strofa2: 'Sănătatea tuturor\nȘi fericirea noastră',
        final: 'De pahar pentru prietenie'
      },
      'populara': {
        strofa1: 'În stilul popular românesc\nCu tradițiile strămoșilor',
        refren: 'Populară, populară\nMuzica noastră de suflet',
        strofa2: 'Folclorul și modernitatea\nSe împletesc perfect',
        final: 'Populară pentru tradiție'
      },
      'orientale': {
        strofa1: 'În ritmul oriental misterios\nCu melodiile exotice',
        refren: 'Orientale, orientale\nMuzica de pe alte meleaguri',
        strofa2: 'Instrumente străine\nȘi ritmuri hipnotizante',
        final: 'Orientale pentru mister'
      },
      'lautaresti': {
        strofa1: 'În stilul lăutăresc autentic\nCu muzica de la țară',
        refren: 'Lăutărești, lăutărești\nMuzica noastră de acasă',
        strofa2: 'Tradiția și autenticitatea\nSe păstrează în fiecare notă',
        final: 'Lăutărești pentru tradiție'
      }
    };

    return lyricsPatterns[style] || lyricsPatterns['populara'];
  }
}

/**
 * Mock Suno service that simulates music generation
 */
export class MockSunoService {
  private static instance: MockSunoService;
  
  private constructor() {}
  
  static getInstance(): MockSunoService {
    if (!MockSunoService.instance) {
      MockSunoService.instance = new MockSunoService();
    }
    return MockSunoService.instance;
  }

  /**
   * Mock music generation with realistic delay
   */
  async generateMusic(
    title: string, 
    style: string, 
    lyrics: string
  ): Promise<MockSunoResponse> {
    const startTime = Date.now();
    
    try {
      logWithTimestamp(`🎵 Mock Suno: Generating music for "${title}" (${style})`);
      
      // Simulate API call delay (music generation takes longer than lyrics)
      const delay = testConfig.mockDelay.suno;
      await sleep(delay);
      
      // Generate mock audio URL
      const mockAudioUrl = this.generateMockAudioUrl(title, style);
      
      const responseTime = Date.now() - startTime;
      
      logWithTimestamp(`✅ Mock Suno: Music generated successfully (${responseTime}ms)`);
      
      return {
        success: true,
        audioUrl: mockAudioUrl,
        delay: responseTime
      };
      
    } catch (error) {
      const responseTime = Date.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      logWithTimestamp(`❌ Mock Suno: Failed to generate music - ${errorMessage}`, 'ERROR');
      
      return {
        success: false,
        error: errorMessage,
        delay: responseTime
      };
    }
  }

  /**
   * Generate realistic mock audio URL
   */
  private generateMockAudioUrl(title: string, style: string): string {
    const timestamp = Date.now();
    const randomId = Math.random().toString(36).substring(2, 15);
    const sanitizedTitle = title.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase();
    
    return `https://mock-suno-storage.manele.io/music/${sanitizedTitle}-${style}-${timestamp}-${randomId}.mp3`;
  }

  /**
   * Simulate music generation progress
   */
  async simulateProgress(callback: (progress: number) => void): Promise<void> {
    const steps = 10;
    for (let i = 1; i <= steps; i++) {
      await sleep(500); // 500ms between progress updates
      callback((i / steps) * 100);
    }
  }
}

/**
 * Mock payment service that simulates payment processing
 */
export class MockPaymentService {
  private static instance: MockPaymentService;
  
  private constructor() {}
  
  static getInstance(): MockPaymentService {
    if (!MockPaymentService.instance) {
      MockPaymentService.instance = new MockPaymentService();
    }
    return MockPaymentService.instance;
  }

  /**
   * Mock payment processing
   */
  async processPayment(
    amount: number, 
    paymentType: string
  ): Promise<{ success: boolean; transactionId: string; delay: number }> {
    const startTime = Date.now();
    
    try {
      logWithTimestamp(`💳 Mock Payment: Processing ${paymentType} payment of ${amount}`);
      
      // Simulate payment processing delay
      await sleep(1000);
      
      // Generate mock transaction ID
      const transactionId = `mock-txn-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
      
      const responseTime = Date.now() - startTime;
      
      logWithTimestamp(`✅ Mock Payment: Payment processed successfully (${responseTime}ms)`);
      
      return {
        success: true,
        transactionId,
        delay: responseTime
      };
      
    } catch (error) {
      const responseTime = Date.now() - startTime;
      logWithTimestamp(`❌ Mock Payment: Payment failed`, 'ERROR');
      
      throw new Error('Payment processing failed');
    }
  }
}

// Export singleton instances
export const mockOpenAI = MockOpenAIService.getInstance();
export const mockSuno = MockSunoService.getInstance();
export const mockPayment = MockPaymentService.getInstance();
