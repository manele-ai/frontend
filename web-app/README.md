# Manele IO Web App

Aplicația web pentru generarea de manele, convertită din aplicația React Native.

## Structura proiectului

```
web-app/
├── src/
│   ├── api/
│   │   └── index.js          # Funcții API și storage
│   ├── pages/
│   │   ├── HomePage.js       # Pagina principală cu formularul
│   │   ├── PaymentPage.js    # Pagina de plată Stripe
│   │   └── ResultPage.js     # Pagina de rezultat cu player audio
│   ├── styles/
│   │   ├── App.css           # Stiluri globale
│   │   ├── HomePage.css      # Stiluri pentru HomePage
│   │   ├── PaymentPage.css   # Stiluri pentru PaymentPage
│   │   └── ResultPage.css    # Stiluri pentru ResultPage
│   ├── App.js                # Componenta principală cu routing
│   └── index.js              # Punctul de intrare
├── public/
└── package.json
```

## Instalare și rulare

1. Instalează dependențele:
```bash
npm install
```

2. Pornește aplicația în modul development:
```bash
npm start
```

3. Aplicația va fi disponibilă la `http://localhost:3000`

## Dependențe principale

- `react-router-dom` - pentru routing între pagini
- `@stripe/react-stripe-js` - pentru integrarea Stripe
- `@stripe/stripe-js` - pentru funcționalitatea Stripe

## Funcționalități

### 1. HomePage (`/`)
- Formular pentru completarea detaliilor despre manea
- Selectare stil (Easy/Complex)
- Câmpuri pentru dedicație și donație
- Navigare către pagina de plată

### 2. PaymentPage (`/payment`)
- Integrare Stripe pentru plăți
- Formular pentru card de credit
- Navigare către pagina de rezultat după plată

### 3. ResultPage (`/result`)
- Polling pentru statusul generării
- Player audio pentru redarea piesei
- Animație waveform în timpul redării
- Salvare automată în localStorage

## Configurare Stripe

Înlocuiește `STRIPE_PUBLISHABLE_KEY` din `PaymentPage.js` cu cheia ta publică Stripe:

```javascript
const STRIPE_PUBLISHABLE_KEY = 'pk_test_your_key_here';
```

## API Endpoints

Aplicația folosește următoarele endpoint-uri (trebuie configurate):

- `POST /api/create` - pentru generarea piesei
- `GET /api/status/:id` - pentru verificarea statusului
- `POST /api/complete` - pentru finalizarea generării

## Storage

Aplicația folosește `localStorage` pentru:
- Salvare request-uri de generare
- Lista de manele generate
- Date temporare între pagini

## Responsive Design

Aplicația este optimizată pentru:
- Desktop (max-width: 1200px)
- Tablet (max-width: 768px)
- Mobile (max-width: 480px)
