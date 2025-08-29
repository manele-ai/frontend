import { config, logger } from 'firebase-functions';
import { onCall } from 'firebase-functions/v2/https';
import { google } from 'googleapis';
import { GOOGLE_SHEET_SA_JSON, REGION } from '../config';
import { GOOGLE_SHEETS_CONFIG } from '../config/google-sheets';
const credentials = JSON.parse(GOOGLE_SHEET_SA_JSON.value() || '{}');

// Configure Google Sheets API
const auth = new google.auth.GoogleAuth({
  credentials,
  scopes: ['https://www.googleapis.com/auth/spreadsheets'],
});

const sheets = google.sheets({ version: 'v4', auth });


interface FeedbackData {
  name: string;
  email: string;
  songTitle: string;
  rating: number;
  feedback: string;
}

export const submitFeedback = onCall<FeedbackData>(
  {
    region: REGION,
    enforceAppCheck: true,
  },
  async (request) => {
  try {
    const { data, auth } = request;
    
    if (!auth || !auth.uid) {
      throw new Error('Trebuie să fii autentificat pentru a trimite feedback.');
    }
    
    const { name, email, songTitle, rating, feedback } = data;

    // Validate required fields
    if (!name || !email || !rating || !feedback) {
      throw new Error('Toate câmpurile obligatorii trebuie completate');
    }

    // Use configured Google Sheets ID from Firebase config or fallback
    const spreadsheetId = config().google?.sheets_id || GOOGLE_SHEETS_CONFIG.SPREADSHEET_ID;
    
    // Validate spreadsheet ID
    if (!spreadsheetId || spreadsheetId === 'YOUR_SPREADSHEET_ID_HERE' || spreadsheetId === 'YOUR_ACTUAL_SHEET_ID_HERE') {
      throw new Error('Google Sheets ID not configured. Please set google.sheets_id in Firebase config.');
    }
    
    // Prepare data for Google Sheets
    const values = [
      [
        name,
        email,
        songTitle || '',
        rating.toString(),
        feedback,
        new Date().toISOString()
      ]
    ];

    // Append data to Google Sheets
    const response = await sheets.spreadsheets.values.append({
      spreadsheetId,
      range: `${GOOGLE_SHEETS_CONFIG.SHEET_NAME}!${GOOGLE_SHEETS_CONFIG.RANGE}`,
      valueInputOption: 'RAW',
      insertDataOption: 'INSERT_ROWS',
      requestBody: {
        values,
      },
    });

    logger.info('Feedback submitted successfully', { 
      updatedRange: response.data.updates?.updatedRange,
      updatedRows: response.data.updates?.updatedRows 
    });

    return {
      success: true,
      message: 'Feedback trimis cu succes!'
    };

  } catch (error) {
    logger.error('Error submitting feedback:', error);
    throw new Error('A apărut o eroare la trimiterea feedback-ului. Te rugăm să încerci din nou.');
  }
});
