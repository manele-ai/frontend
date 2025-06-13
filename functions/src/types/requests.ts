// ============= API Request Types =============
// Prefix with 'Request' for incoming HTTP requests

export namespace Requests {
  export interface GenerateSong {
    userId: string;
    prompt: string;
  }
  
  export interface GetStatus {
    taskId: string;
  }
}
