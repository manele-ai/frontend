// ============= API Request Types =============
// Prefix with 'Request' for incoming HTTP requests

export namespace Requests {
  export interface GenerateSong {
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
  
  export interface GetStatus {
    taskId: string;
  }

  export interface CreateStripeCheckoutSession {
    credits: number; // number of credits to purchase
  }
}
