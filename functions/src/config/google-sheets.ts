// Google Sheets Configuration
export const GOOGLE_SHEETS_CONFIG = {
  // Replace with your actual Google Sheet ID
  SPREADSHEET_ID: process.env.GOOGLE_SHEETS_ID,
  
  // Sheet name and range
  SHEET_NAME: 'Sheet1',
  RANGE: 'A:F',
  
  // Service account key path (no longer used - credentials are in environment variable)
  SERVICE_ACCOUNT_KEY_PATH: null,
  
  // Column headers (for reference)
  COLUMNS: {
    NAME: 'A',
    EMAIL: 'B', 
    SONG_TITLE: 'C',
    RATING: 'D',
    FEEDBACK: 'E',
    DATE: 'F'
  }
};
