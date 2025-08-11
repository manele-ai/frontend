# PostHog Setup pentru Manele AI

## Configurare

### 1. Variabile de mediu
Creează un fișier `.env.local` în directorul `web-app/` cu următoarele variabile:

```env
REACT_APP_POSTHOG_KEY=phc_ibZxJGpzVpLsgYgg456tursWuvc5wwpZFoMhjaE0kxl
REACT_APP_POSTHOG_HOST=https://eu.i.posthog.com
```

**Important**: În Create React App, toate variabilele de mediu trebuie să înceapă cu `REACT_APP_` pentru a fi accesibile în aplicație.

### 2. Integrare în aplicație
PostHog este integrat în `src/index.js` cu `PostHogProvider` și `PostHogErrorBoundary`:

```javascript
const options = {
  api_host: process.env.REACT_APP_POSTHOG_HOST || 'https://eu.i.posthog.com'
}

<PostHogProvider apiKey={process.env.REACT_APP_POSTHOG_KEY} options={options}>
  <PostHogErrorBoundary fallback={ErrorFallback}>
    <App />
  </PostHogErrorBoundary>
</PostHogProvider>
```

## Error Handling

### Error Boundaries
Aplicația folosește `PostHogErrorBoundary` pentru a captura erorile de randare React și a afișa o componentă de fallback prietenoasă.

### Global Error Tracking
Sunt configurate următoarele tipuri de erori pentru tracking automat:

- **JavaScript Errors**: Erori neprinse din JavaScript
- **Promise Rejections**: Promise-uri respinse fără handler
- **React Render Errors**: Erori de randare în componente

### Capturarea manuală a excepțiilor
Pentru erori specifice, poți folosi `captureException()` pentru a captura manual excepțiile:

```javascript
import { usePostHogTracking } from '../utils/posthog';

const { captureException } = usePostHogTracking();

try {
  // cod care poate da eroare
  throw new Error('Eroare specifică');
} catch (error) {
  captureException(error, {
    context: 'payment_processing',
    user_id: user.id,
    action: 'stripe_payment'
  });
}
```

### Error Fallback Component
Când apare o eroare, utilizatorul vede:
- Mesaj prietenos "Ceva nu a mers bine"
- Buton pentru reîncărcarea paginii

## Utilizare

### Tracking automat
- **Page Views**: Se track-uiesc automat când utilizatorul navighează între pagini
- **Autentificare**: Se track-uiesc evenimentele de login/logout și erorile
- **Erori**: Toate erorile sunt capturate și trimise la PostHog

### Tracking manual
Pentru a adăuga tracking manual în componente:

```javascript
import { usePostHogTracking } from '../utils/posthog';

function MyComponent() {
  const { trackButtonClick, trackError, captureException } = usePostHogTracking();
  
  const handleButtonClick = () => {
    trackButtonClick('generate_song', 'generate_page');
    // restul logicii
  };
  
  const handleError = (error) => {
    trackError('generation_failed', error.message, 'result_page');
  };
  
  const handleCriticalError = (error) => {
    captureException(error, {
      context: 'song_generation',
      user_action: 'generate_button_click'
    });
  };
}
```

## Evenimente disponibile

### Tracking Functions
- `trackPageView(pageName)` - Track page views
- `trackSongGeneration(style, mode, price)` - Track începerea generării
- `trackSongCompleted(songId, style, duration)` - Track finalizarea generării
- `trackButtonClick(buttonName, page)` - Track click-uri pe butoane
- `trackError(errorType, errorMessage, page)` - Track erori manuale
- `trackAuth(authType, success)` - Track autentificare
- `trackPayment(paymentType, amount, success)` - Track plăti
- `captureException(error, additionalProps)` - Capturare manuală excepții

### Evenimente de eroare automate
- `javascript_error` - Erori JavaScript neprinse
- `unhandled_promise_rejection` - Promise-uri respinse
- `error_occurred` - Erori manuale track-uite

### Exemple de utilizare

#### Track generare melodie
```javascript
const { trackSongGeneration } = usePostHogTracking();

const handleGenerate = () => {
  trackSongGeneration('manele', 'easy', 5);
  // restul logicii
};
```

#### Track erori manuale
```javascript
const { trackError } = usePostHogTracking();

try {
  // cod care poate da eroare
} catch (error) {
  trackError('api_error', error.message, 'result_page');
}
```

#### Capturare manuală excepții
```javascript
const { captureException } = usePostHogTracking();

try {
  // cod critic care poate da eroare
  processPayment();
} catch (error) {
  captureException(error, {
    context: 'payment_processing',
    user_id: user.id,
    payment_amount: amount,
    payment_method: 'stripe'
  });
}
```

#### Track click-uri pe butoane
```javascript
const { trackButtonClick } = usePostHogTracking();

const handleDownload = () => {
  trackButtonClick('download_song', 'result_page');
  // logica de download
};
```

## Dashboard PostHog

Accesează dashboard-ul PostHog pentru a vedea:
- Evenimente în timp real
- Funnel-uri de conversie
- Retenția utilizatorilor
- **Erori și crash-uri**
- Comportamentul utilizatorilor

### Secțiunea de erori
În dashboard-ul PostHog vei găsi:
- **Error Trends**: Tendințe ale erorilor în timp
- **Error Breakdown**: Tipuri de erori și frecvența lor
- **User Impact**: Câți utilizatori au întâlnit erori
- **Error Details**: Stack traces și context complet
- **Exception Groups**: Grupări de excepții similare

## Debugging

Pentru debugging local, verifică:
1. Console-ul browser-ului pentru erori PostHog
2. Network tab pentru request-uri către PostHog
3. Dashboard-ul PostHog pentru evenimente live
4. **Secțiunea de erori** din dashboard pentru crash-uri

## Note importante

- PostHog capturează automat page views și sesiuni
- Toate evenimentele includ timestamp automat
- User properties se setează automat la autentificare
- Pentru GDPR, PostHog respectă setările de confidențialitate
- **Create React App**: Folosește `process.env.REACT_APP_*` pentru variabile de mediu
- **Restart necesar**: După modificarea `.env.local`, repornește aplicația cu `npm start`
- **Error Recovery**: Utilizatorii pot reîncărca pagina din error boundary
- **Manual Exceptions**: Folosește `captureException()` pentru erori critice
