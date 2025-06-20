# Firebase Configuration pentru Web App

## Pași pentru configurare:

### 1. Creează fișierul .env în directorul web-app

Creează un fișier numit `.env` în directorul `web-app/` cu următorul conținut:

```env
# Firebase Configuration
REACT_APP_FIREBASE_API_KEY=your_firebase_api_key_here
REACT_APP_FIREBASE_PROJECT_ID=manele-ai-dev-fa776
REACT_APP_FIREBASE_AUTH_DOMAIN=manele-ai-dev-fa776.firebaseapp.com
REACT_APP_FIREBASE_STORAGE_BUCKET=manele-ai-dev-fa776.appspot.com
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id_here
REACT_APP_FIREBASE_APP_ID=your_app_id_here

# Development settings
REACT_APP_USE_FIREBASE_EMULATOR=false
```

### 2. Obține valorile Firebase

1. Mergi la [Firebase Console](https://console.firebase.google.com)
2. Selectează proiectul: `manele-ai-dev-fa776`
3. Mergi la **Project Settings** (iconița cu roțița)
4. Scroll jos la secțiunea **"Your apps"**
5. Dacă nu ai o aplicație web, click **"Add app"** și alege **Web**
6. Copiază valorile din configurație

### 3. Înlocuiește valorile în .env

Înlocuiește `your_firebase_api_key_here` etc. cu valorile reale din Firebase Console.

### 4. Repornește aplicația

```bash
cd web-app
npm start
```

## Structura valorilor Firebase:

```javascript
// Exemplu de configurație Firebase
const firebaseConfig = {
  apiKey: "AIzaSyC...", // REACT_APP_FIREBASE_API_KEY
  authDomain: "manele-ai-dev-fa776.firebaseapp.com", // REACT_APP_FIREBASE_AUTH_DOMAIN
  projectId: "manele-ai-dev-fa776", // REACT_APP_FIREBASE_PROJECT_ID
  storageBucket: "manele-ai-dev-fa776.appspot.com", // REACT_APP_FIREBASE_STORAGE_BUCKET
  messagingSenderId: "123456789", // REACT_APP_FIREBASE_MESSAGING_SENDER_ID
  appId: "1:123456789:web:abc123" // REACT_APP_FIREBASE_APP_ID
};
```

## Notă importantă:

- Toate variabilele de mediu pentru React trebuie să înceapă cu `REACT_APP_`
- Fișierul `.env` nu trebuie să fie commitat în git (este deja în .gitignore)
- După modificarea .env, trebuie să repornești aplicația 