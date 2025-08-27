import { logger } from 'firebase-functions';
import { onCall } from 'firebase-functions/v2/https';
import { google } from 'googleapis';

// Configure Google Sheets API
const auth = new google.auth.GoogleAuth({
  keyFile: './service-account-key.json', // You'll need to add this file
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

export const submitFeedback = onCall<FeedbackData>(async (request) => {
  try {
    const { name, email, songTitle, rating, feedback } = request.data;

    // Validate required fields
    if (!name || !email || !rating || !feedback) {
      throw new Error('Toate câmpurile obligatorii trebuie completate');
    }

    // Google Sheets ID - replace with your actual sheet ID
    const spreadsheetId = 'YOUR_SPREADSHEET_ID';
    
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
      range: 'Sheet1!A:F', // Adjust range as needed
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
