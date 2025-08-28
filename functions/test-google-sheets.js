// Test script pentru Google Sheets configuration
const { google } = require('googleapis');
const path = require('path');

async function testGoogleSheetsConfig() {
  try {
    console.log('🔍 Testing Google Sheets configuration...');
    
    // Test service account key
    const keyPath = path.join(__dirname, 'service-account-key.json');
    console.log('📁 Service account key path:', keyPath);
    
    const auth = new google.auth.GoogleAuth({
      keyFile: keyPath,
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });
    
    console.log('✅ Service account authentication successful');
    
    const sheets = google.sheets({ version: 'v4', auth });
    
    // Test with your actual spreadsheet ID
    const testSpreadsheetId = '1SOg7jhcaAeQcDC38WH_04-YvxMJpRCr9FqjKddgAtT0';
    
    console.log('📊 Testing spreadsheet access...');
    
    const response = await sheets.spreadsheets.get({
      spreadsheetId: testSpreadsheetId,
    });
    
    console.log('✅ Spreadsheet access successful');
    console.log('📋 Sheet title:', response.data.properties.title);
    console.log('📄 Available sheets:', response.data.sheets.map(s => s.properties.title));
    
  } catch (error) {
    console.error('❌ Error testing Google Sheets config:', error.message);
    
    if (error.code === 404) {
      console.log('💡 Tip: Make sure the spreadsheet ID is correct and the service account has access');
    } else if (error.code === 403) {
      console.log('💡 Tip: Make sure the service account has permission to access the spreadsheet');
    }
  }
}

testGoogleSheetsConfig();
