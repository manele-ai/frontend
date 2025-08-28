# Setup Google Sheets pentru Feedback

## Pași de configurare:

### 1. Creează Google Sheet
1. Mergi la [Google Sheets](https://sheets.google.com/)
2. Creează un sheet nou
3. Adaugă următoarele coloane în prima linie:
   ```
   A: Nume | B: Email | C: Piesa | D: Rating | E: Feedback | F: Data
   ```
4. Copiază ID-ul din URL: `https://docs.google.com/spreadsheets/d/YOUR_SHEET_ID/edit`

### 2. Creează Service Account
1. Mergi la [Google Cloud Console](https://console.cloud.google.com/)
2. Creează proiect nou sau selectează unul existent
3. Activează **Google Sheets API**
4. Creează Service Account:
   - Name: `manele-feedback-service`
   - Description: `Service account for feedback submissions`
5. Generează cheie JSON și download-o

### 3. Configurează Permisiuni
1. În Google Sheet, click "Share"
2. Adaugă email-ul service account-ului (din JSON)
3. Dă permisiuni "Editor"

### 4. Adaugă fișierele în proiect
1. Copiază `service-account-key.json` în folderul `functions/`
2. Actualizează `GOOGLE_SHEETS_ID` în `src/config/google-sheets.ts`

### 5. Testează
1. Deploy functions: `npm run deploy`
2. Testează feedback din aplicație
3. Verifică datele în Google Sheet

## Structura datelor:
- **Nume**: Numele utilizatorului
- **Email**: Email-ul utilizatorului  
- **Piesa**: Titlul piesei pentru care se dă feedback
- **Rating**: Rating-ul (1-5 stele)
- **Feedback**: Comentariul utilizatorului
- **Data**: Data și ora trimiterii (ISO format)
