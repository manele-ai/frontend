# Manele AI Stress Testing

Scripts pentru testarea de performanță a aplicației Manele AI pe mediul de staging.

## 🎯 Obiective

1. **Crearea conturilor de test** - Generează 100 de conturi de test cu email-uri `stress.test{N}@gmail.com`
2. **Stress testing** - Lansează N<100 request-uri de generare simultan către backend-ul de staging

## 📁 Structura Proiectului

```
scripts/stress-testing/
├── src/
│   ├── createTestAccounts.ts    # Creare conturi de test
│   ├── stressTest.ts           # Script principal de stress testing
│   ├── testDataGenerator.ts    # Generare date de test
│   ├── performanceMonitor.ts   # Monitorizare performanță
│   ├── config.ts              # Configurare staging
│   ├── types.ts               # Tipuri TypeScript
│   └── utils.ts               # Funcții utilitare
├── output/                    # Rezultate testare
├── package.json
├── tsconfig.json
├── env.example               # Exemplu configurare
└── README.md
```

## 🚀 Instalare și Configurare

### 1. Instalare dependențe

```bash
cd scripts/stress-testing
npm install
```

### 2. Configurare variabile de mediu

Creează un fișier `.env` bazat pe `env.example`:

```bash
cp env.example .env
```

Editează `.env` cu valorile corecte:

```env
# Firebase Configuration for Staging
FIREBASE_PROJECT_ID=manele-io-test
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYOUR_PRIVATE_KEY_HERE\n-----END PRIVATE KEY-----\n"
FIREBASE_CLIENT_EMAIL=your-service-account@manele-io-test.iam.gserviceaccount.com

# Test Configuration
TEST_ACCOUNTS_COUNT=100
TEST_EMAIL_PREFIX=stress.test
TEST_EMAIL_DOMAIN=gmail.com
TEST_PASSWORD=StressTest123!

# Stress Test Configuration
MAX_CONCURRENT_REQUESTS=50
REQUESTS_PER_SECOND=2
TEST_DURATION_SECONDS=300
```

### 3. Obținere Service Account

Pentru a crea conturile de test, ai nevoie de un Firebase Service Account:

1. Mergi la [Firebase Console](https://console.firebase.google.com)
2. Selectează proiectul `manele-io-test`
3. Mergi la **Project Settings** > **Service Accounts**
4. Click **Generate New Private Key**
5. Descarcă fișierul JSON și copiază valorile în `.env`

## 📋 Utilizare

### Comenzi Disponibile

```bash
# 🎯 WORKFLOW COMPLET (Recomandat)
npm run full-test [N]        # Rulează tot: creare conturi + stress test + cleanup

# Comenzi individuale
npm run create-accounts      # Creare conturi de test
npm run stress-test [N]      # Stress testing cu N request-uri
npm run clean-accounts       # Ștergere conturi de test

# Utilitare
npm run build               # Build TypeScript
npm run clean               # Clean build directory
```

### 🚀 Utilizare Rapidă

Pentru un test complet cu o singură comandă:

```bash
# Test cu 10 request-uri (default)
npm run full-test

# Test cu 50 request-uri
npm run full-test 50

# Test cu 100 request-uri
npm run full-test 100
```

### 🎯 Workflow Complet

Comanda `full-test` rulează automat toate etapele:

1. **📝 Creare conturi de test** - Generează conturile necesare
2. **🚀 Stress testing** - Lansează request-urile de test
3. **🧹 Cleanup** - Șterge toate conturile și datele de test

**Avantaje:**
- ✅ O singură comandă pentru tot
- ✅ Cleanup automat la final
- ✅ Raport complet de performanță
- ✅ Error handling și recovery
- ✅ Nu lasă date de test în sistem

### Crearea Conturilor de Test

```bash
npm run create-accounts
```

Acest script va:
- Crea 100 de conturi de test cu email-uri `stress.test{N}@gmail.com`
- Crea profiluri Firestore pentru fiecare utilizator
- Salva rezultatele în `output/test-accounts-{timestamp}.json`
- Genera un raport de sumar

### Stress Testing

```bash
npm run stress-test
```

Acest script va:
- Încărca conturile de test create anterior
- Autentifica utilizatorii
- Lansă request-uri de generare simultan
- Monitoriza performanța și rate-ul de succes
- Genera rapoarte de performanță

## 📊 Monitorizare și Rapoarte

### Logs în Timp Real

Scripturile afișează logs detaliate în timp real:
- Progresul creării conturilor
- Status-ul request-urilor de generare
- Metrici de performanță
- Erori și warning-uri

### Fișiere de Output

Rezultatele sunt salvate în folderul `output/`:

- `test-accounts-{timestamp}.json` - Rezultate complete creare conturi
- `successful-accounts-{timestamp}.json` - Doar conturile create cu succes
- `stress-test-results-{timestamp}.json` - Rezultate stress testing
- `performance-report-{timestamp}.json` - Raport de performanță

### Metrici Monitorizate

- **Timp de răspuns** - Latency pentru fiecare request
- **Rate de succes** - Procentaj request-uri reușite
- **Throughput** - Request-uri per secundă
- **Rate de eroare** - Procentaj request-uri eșuate
- **Utilizare resurse** - CPU, memorie, network

## ⚙️ Configurare Avansată

### Rate Limiting

Scripturile respectă limitele Firebase:
- **Max 2 requests/sec** pentru generation tasks
- **Max 80 concurrent dispatches**
- **Batch processing** pentru crearea conturilor

### Retry Logic

- **Exponential backoff** pentru request-uri eșuate
- **Max 3 retry-uri** per request
- **Delay progresiv** între retry-uri

### Cleanup

Pentru a șterge conturile de test după testare:

```bash
npm run clean-accounts
```

Acest script va:
- Șterge toate conturile de test din Firebase Auth
- Șterge profilurile Firestore asociate
- Șterge toate request-urile de stress testing
- Șterge fișierul de conturi de test
- Genera un raport de cleanup

## 🔧 Dezvoltare

### Build

```bash
npm run build
```

### Development

```bash
npm run dev
```

### Linting

```bash
npm run lint
```

## 📈 Interpretarea Rezultatelor

### Rate de Succes Acceptabil

- **> 95%** - Excelent
- **90-95%** - Bun
- **< 90%** - Necesită investigare

### Timp de Răspuns Acceptabil

- **< 2s** - Excelent
- **2-5s** - Acceptabil
- **> 5s** - Necesită optimizare

### Throughput

- **> 1.5 req/s** - Excelent
- **1-1.5 req/s** - Acceptabil
- **< 1 req/s** - Necesită investigare

## 🚨 Troubleshooting

### Erori Comune

1. **Firebase Authentication Error**
   - Verifică configurarea Service Account
   - Asigură-te că proiectul este corect

2. **Rate Limiting**
   - Reduce `REQUESTS_PER_SECOND` în `.env`
   - Mărește delay-ul între batch-uri

3. **Memory Issues**
   - Reduce `MAX_CONCURRENT_REQUESTS`
   - Monitorizează utilizarea memoriei

### Debug Mode

Pentru debug detaliat, setează:

```env
DEBUG=true
LOG_LEVEL=debug
```

## 📞 Suport

Pentru probleme sau întrebări:
1. Verifică logs-urile pentru erori
2. Consultă documentația Firebase
3. Contactează echipa de dezvoltare

## 🔒 Securitate

- **Nu commita** fișierul `.env`
- **Folosește doar** conturi de test
- **Testează doar** pe staging, nu pe production
- **Șterge conturile** de test după utilizare
