import { MUSIC_STYLES, SAMPLE_LYRICS_DETAILS, SAMPLE_TITLES } from './config';
import { GenerationRequest } from './types';

export class TestDataGenerator {
  private requestCounter = 0;

  /**
   * Generate a random generation request for testing
   */
  generateRandomRequest(): GenerationRequest {
    this.requestCounter++;
    
    const randomStyle = MUSIC_STYLES[Math.floor(Math.random() * MUSIC_STYLES.length)];
    const randomTitle = SAMPLE_TITLES[Math.floor(Math.random() * SAMPLE_TITLES.length)];
    const randomLyrics = SAMPLE_LYRICS_DETAILS[Math.floor(Math.random() * SAMPLE_LYRICS_DETAILS.length)];
    
    // Randomly decide if we want dedication (but disable donation for stress testing)
    const wantsDedication = Math.random() > 0.6; // 40% chance for dedication
    
    const request: GenerationRequest = {
      title: `${randomTitle} ${this.requestCounter}`,
      lyricsDetails: randomLyrics,
      style: randomStyle,
      wantsDedication,
      wantsDonation: false, // Always false for stress testing
      from: wantsDedication ? 'Test User' : undefined,
      to: wantsDedication ? 'Loved One' : undefined,
      dedication: wantsDedication ? 'Cu dragoste și respect' : undefined,
      donorName: undefined,
      donationAmount: undefined
    };
    
    return request;
  }

  /**
   * Generate multiple random requests
   */
  generateMultipleRequests(count: number): GenerationRequest[] {
    const requests: GenerationRequest[] = [];
    
    for (let i = 0; i < count; i++) {
      requests.push(this.generateRandomRequest());
    }
    
    return requests;
  }

  /**
   * Generate a specific request for testing
   */
  generateSpecificRequest(options: {
    title?: string;
    style?: string;
    lyricsDetails?: string;
    wantsDedication?: boolean;
  } = {}): GenerationRequest {
    this.requestCounter++;
    
    const request: GenerationRequest = {
      title: options.title || `Test Song ${this.requestCounter}`,
      lyricsDetails: options.lyricsDetails || 'O piesă de test pentru stress testing',
      style: options.style || MUSIC_STYLES[0],
      wantsDedication: options.wantsDedication || false,
      wantsDonation: false,
      from: options.wantsDedication ? 'Test User' : undefined,
      to: options.wantsDedication ? 'Loved One' : undefined,
      dedication: options.wantsDedication ? 'Cu dragoste și respect' : undefined,
      donorName: undefined,
      donationAmount: undefined
    };
    
    return request;
  }

  /**
   * Generate requests with different styles for comprehensive testing
   */
  generateStyleTestRequests(): GenerationRequest[] {
    const requests: GenerationRequest[] = [];
    
    MUSIC_STYLES.forEach((style, index) => {
      requests.push(this.generateSpecificRequest({
        title: `Test ${style} Song`,
        style: style,
        lyricsDetails: `Test pentru stilul ${style}`,
        wantsDedication: index % 2 === 0 // Alternate dedication
      }));
    });
    
    return requests;
  }

  /**
   * Get available styles for testing
   */
  getAvailableStyles(): string[] {
    return [...MUSIC_STYLES];
  }

  /**
   * Get sample titles for testing
   */
  getSampleTitles(): string[] {
    return [...SAMPLE_TITLES];
  }

  /**
   * Get sample lyrics details for testing
   */
  getSampleLyricsDetails(): string[] {
    return [...SAMPLE_LYRICS_DETAILS];
  }

  /**
   * Reset the request counter
   */
  resetCounter(): void {
    this.requestCounter = 0;
  }

  /**
   * Get current request counter
   */
  getRequestCounter(): number {
    return this.requestCounter;
  }
}
