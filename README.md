# 🎵 Manele IO - AI-Powered Romanian Song Generator

O aplicație web modernă pentru generarea de piese manele românești folosind inteligența artificială, cu sistem complet de autentificare și gestionarea utilizatorilor.

## 🌟 Caracteristici Principale

### 🎼 Generare Piese
- **8 stiluri diferite** de manele (Jale, Petrecere, Comerciale, etc.)
- **Moduri de generare**: Easy (simplu) și Complex (detaliat)
- **Personalizare avansată**: dedicații, donații, detalii versuri
- **Generare în timp real** cu progres vizual

### 🔐 Sistem de Autentificare
- **Email/Password** - înregistrare și login tradițional
- **Google Sign-In** - autentificare rapidă cu Google
- **Resetare parolă** prin email
- **Profil utilizator** cu statistici și preferințe
- **Protecție rute** - acces controlat la funcționalități

### 🎵 Player Audio
- **Player modern** cu controale intuitive
- **Descărcare piese** în format MP3
- **Istoric piese** - acces la toate piesele generate
- **Playlist personal** - organizare și gestionare

### 💳 Sistem de Plată
- **Integrare Stripe** pentru plăți securizate
- **Procesare carduri** în timp real
- **Confirmare plată** cu feedback vizual

## 🏗️ Arhitectura Tehnică

### Frontend (React)
```
web-app/
├── src/
│   ├── components/
│   │   ├── auth/           # Sistem autentificare
│   │   └── ui/             # Componente UI
│   ├── pages/              # Pagini aplicație
│   ├── services/           # Servicii Firebase
│   ├── hooks/              # Custom hooks
│   ├── styles/             # CSS și stilizare
│   └── utils/              # Utilități
```

### Backend (Firebase)
```
functions/
├── src/
│   ├── handlers/           # Logică principală
│   ├── api/               # Integrări API
│   ├── data/              # Template-uri stiluri
│   └── types/             # Tipuri TypeScript
```

### Data Model (Firestore)
```
/users/{uid}

/usersPublic/{uid}
    - mirrors part of /usersPrivate

/tasks/{taskId}

/songs/{songId}

/songsPublic/{songId}
 - mirrors part of /songs


/stats/{periodType}/{periodKey}/{bucket}/{id}
- {bucket} in 'donation', 'likes', 'numSongs'
```

## 🚀 Tehnologii Utilizate

### Frontend
- **React 19** - Framework UI
- **React Router** - Navigare și routing
- **Firebase SDK** - Autentificare și baza de date
- **Stripe** - Procesare plăți
- **CSS3** - Stilizare modernă și responsive

### Backend
- **Firebase Functions** - Serverless backend
- **Firestore** - Baza de date NoSQL
- **Firebase Auth** - Autentificare utilizatori
- **OpenAI GPT-4** - Generare versuri
- **Third-party Music API** - Generare muzică

### DevOps
- **Firebase Hosting** - Deployment
- **Firebase Emulator** - Dezvoltare locală
- **Git** - Control versiuni

## 📦 Instalare și Configurare

### Prerequisites
- Node.js 18+
- npm sau yarn
- Cont Firebase
- API keys pentru OpenAI și serviciul de muzică

### 1. Clonează Repository-ul
```bash
git clone https://github.com/your-username/manele-ai.git
cd manele-ai
```

### 2. Instalează Dependențele
```bash
# Frontend
cd web-app
npm install

# Backend
cd ../functions
npm install
```

### 3. Configurare Firebase
```bash
# Instalează Firebase CLI
npm install -g firebase-tools

# Login în Firebase
firebase login

# Inițializează proiectul
firebase init
```

### 4. Testeaza Stripe local
Mai intai instaleaza Stripe CLI: https://docs.stripe.com/stripe-cli.
```sh
stripe listen --forward-to http://127.0.0.1:5001/manele-io-test/europe-central2/stripeWebhook 
```
Duap ce ai rulat comanda de mai sus cu succes vei primi un webhook secret pe care trebuie sa-l pui in .env in backend
in variabila `STRIPE_WEBHOOK_SECRET`.
Acest cod incepe cu `whsec`.

Mai trebuie adaugata variabila Stripe in .env frontend: REACT_APP_STRIPE_PUBLISHABLE_KEY. 

Dupa poti folosi stripe local cu carduri de test: https://docs.stripe.com/testing#cards.

### 4. Variabile de Mediu

#### Frontend (.env în web-app/)
```env
REACT_APP_FIREBASE_API_KEY=your_firebase_api_key
REACT_APP_FIREBASE_PROJECT_ID=your_project_id
REACT_APP_FIREBASE_AUTH_DOMAIN=your_auth_domain
REACT_APP_FIREBASE_STORAGE_BUCKET=your_storage_bucket
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
REACT_APP_FIREBASE_APP_ID=your_app_id
REACT_APP_USE_FIREBASE_EMULATOR=false
REACT_APP_STRIPE_PUBLISHABLE_KEY=your_stripe_key
```

#### Backend (.env în functions/)
```env
OPENAI_API_KEY=your_openai_api_key
THIRD_PARTY_API_BASE_URL=https://api.examplemusic.com/api/v1
THIRD_PARTY_API_KEY=your_third_party_api_key
MP3_STORAGE_BUCKET=your_project_id.appspot.com
```

### 5. Configurare Firebase

#### Authentication
1. Activează **Email/Password** în Firebase Console
2. Activează **Google Sign-In** în Firebase Console
3. Configurează domeniile autorizate

#### Firestore
1. Creează baza de date Firestore
2. Configurează regulile de securitate
3. Activează indexurile necesare

#### Storage
1. Activează Firebase Storage
2. Configurează regulile de securitate
3. Setează bucket-ul pentru fișiere MP3

### 6. Deployment

#### Backend
```bash
cd functions
npm run build
firebase deploy --only functions
```

#### Frontend
```bash
cd web-app
npm run build
firebase deploy --only hosting
```

## 🎯 Utilizare

### 1. Autentificare
- Accesează aplicația
- Înregistrează-te cu email sau folosește Google
- Completează profilul personal

### 2. Generare Piesă
- Alege modul (Easy/Complex)
- Introdu numele piesei
- Selectează stilul manelei
- Adaugă personalizări (opțional)
- Plătește și așteaptă generarea

### 3. Ascultare și Descărcare
- Monitorizează progresul generării
- Ascultă piesa în player-ul integrat
- Descarcă piesa în format MP3
- Accesează istoricul din "Manelele mele"

## 🔧 Dezvoltare

### Pornire Locală
```bash
# Backend (Firebase Emulator)
firebase emulators:start

# Frontend
cd web-app
npm start
```

### Scripturi Disponibile
```bash
# Frontend
npm start          # Pornește server dezvoltare
npm run build      # Build pentru producție
npm test           # Rulează teste
npm run eject      # Eject din Create React App

# Backend
npm run build      # Compilează TypeScript
npm run serve      # Pornește emulatorul
npm run deploy     # Deploy funcții
```

### Structura Codului

#### Componente React
- **Funcționale** cu hooks
- **TypeScript** pentru type safety
- **CSS modules** pentru stilizare
- **Responsive design** pentru toate dispozitivele

#### Firebase Functions
- **TypeScript** pentru type safety
- **Modular architecture** cu separare responsabilități
- **Error handling** comprehensiv
- **Logging** pentru debugging

## 🎨 Design System

### Culori
- **Primary**: #FFD700 (Gold)
- **Secondary**: #e6c200 (Dark Gold)
- **Background**: #1a1a1a (Dark)
- **Surface**: #23242b (Dark Gray)
- **Error**: #ff3b30 (Red)
- **Success**: #34c759 (Green)

### Tipografie
- **Font**: -apple-system, BlinkMacSystemFont, 'Segoe UI'
- **Weights**: 400, 500, 700
- **Sizes**: 12px - 32px

### Componente
- **Buttons**: Primary, Secondary, Ghost variants
- **Inputs**: Text, Email, Password cu validare
- **Cards**: Profile, Song, Payment
- **Modals**: Auth, Payment, Confirmation

## 🔐 Securitate

### Autentificare
- **Firebase Auth** pentru securitate
- **JWT tokens** pentru sesiuni
- **Email verification** (opțional)
- **Password reset** securizat

### Date
- **Firestore rules** pentru acces controlat
- **User isolation** - utilizatorii văd doar datele lor
- **Input validation** pe frontend și backend
- **XSS protection** prin sanitizare

### Plăți
- **Stripe** pentru procesare securizată
- **PCI compliance** prin Stripe
- **Webhook verification** pentru confirmări
- **Error handling** comprehensiv

## 📊 Monitorizare și Analytics

### Firebase Analytics
- **User behavior** tracking
- **Conversion funnels** pentru plăți
- **Error tracking** și reporting
- **Performance monitoring**

### Logging
- **Structured logging** în Cloud Functions
- **Error aggregation** și alerting
- **User activity** tracking
- **API usage** monitoring

## 🚀 Roadmap

### Versiunea 1.1
- [ ] Autentificare cu Facebook
- [ ] Verificare email obligatorie
- [ ] Two-factor authentication
- [ ] Push notifications

### Versiunea 1.2
- [ ] Editor de versuri
- [ ] Colaborare între utilizatori
- [ ] Playlist-uri și colecții
- [ ] Sharing pe social media

### Versiunea 2.0
- [ ] Mobile app (React Native)
- [ ] AI voice cloning
- [ ] Live collaboration
- [ ] Marketplace pentru piese

## 🤝 Contribuții

### Guidelines
1. Fork repository-ul
2. Creează branch pentru feature
3. Fă commit-urile cu mesaje descriptive
4. Push la branch și creează Pull Request

### Code Style
- **ESLint** pentru JavaScript/TypeScript
- **Prettier** pentru formatting
- **Conventional commits** pentru mesaje
- **TypeScript strict mode**

## 📄 Licență

Acest proiect este licențiat sub [MIT License](LICENSE).

## 📞 Support

- **Email**: support@manele-ai.com
- **Discord**: [Manele AI Community](https://discord.gg/manele-ai)
- **Documentație**: [docs.manele-ai.com](https://docs.manele-ai.com)

## 🙏 Mulțumiri

- **OpenAI** pentru GPT-4
- **Firebase** pentru infrastructura
- **Stripe** pentru procesarea plăților
- **Comunitatea** pentru feedback și suport

---

**Manele IO** - Generând viitorul muzicii românești cu AI 🎵✨ 