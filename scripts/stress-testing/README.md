# Manele AI Stress Testing

Scripts pentru testarea de performanță a aplicației Manele AI pe mediul de staging și local.

## 🎯 Obiective

1. **Crearea conturilor de test** - Generează 100 de conturi de test cu email-uri `stress.test{N}@gmail.com`
2. **Stress testing** - Lansează N<100 request-uri de generare simultan către backend-ul de staging
3. **🆕 Testare locală completă** - Testează flow-ul complet de generare (Request → Payment → OpenAI → Suno → Download) pe emulatorul local

## 🆕 Testare Locală cu Emulator (NOU!)

### 🎯 Ce Testează

Testarea locală simulează **flow-ul complet de generare** fără a apela serviciile externe reale:

```
1. 📝 Create Generation Request → 2. 💳 Simulate Payment Success → 
3. 🤖 Mock OpenAI (lyrics) → 4. 🎵 Mock Suno (music) → 
5. ✅ Complete Generation → 6. 📥 Download URL Ready
```

### 🏗️ Arhitectura

- **Firebase Emulator Suite** - Testare locală completă
- **Mock Services** - OpenAI și Suno simulate cu delays realiste
- **Real Collection** - Folosește `generationRequests` (nu colecții de test)
- **Complete Flow** - Validează toată logica de business

### 🚀 Setup Rapid Local

```bash
# 1. Pornește Firebase Emulator
firebase emulators:start

# 2. Copiază configurarea locală
cp env.local.example .env.local

# 3. Editează .env.local cu valorile tale

# 4. Rulează testul local
npm run local-test 10
```

### 📋 Comenzi Local

```bash
# 🎯 WORKFLOW COMPLET LOCAL
npm run local-full-test [N]     # Test complet local cu N request-uri

# Comenzi individuale locale
npm run local-create-accounts   # Creare conturi în emulator
npm run local-stress-test [N]   # Stress test local cu N request-uri
npm run local-clean-accounts    # Cleanup conturi din emulator

# 🚀 Teste rapide locale
npm run local-test              # Test local cu 10 request-uri
npm run local-test-small        # Test local cu 5 request-uri
npm run local-test-medium       # Test local cu 25 request-uri
npm run local-test-large        # Test local cu 50 request-uri
```

### ⚙️ Configurare Locală

Creează `.env.local` bazat pe `env.local.example`:

```env
# Emulator Configuration
USE_EMULATOR=true
EMULATOR_HOST=127.0.0.1
EMULATOR_FUNCTIONS_PORT=5001
EMULATOR_FIRESTORE_PORT=8081
EMULATOR_AUTH_PORT=9099

# Test Collection (folosește colecția reală)
TEST_COLLECTION=generationRequests
USE_REAL_COLLECTION=true

# Mock Services
MOCK_OPENAI=true
MOCK_SUNO=true
MOCK_OPENAI_DELAY=2000    # 2 secunde pentru lyrics
MOCK_SUNO_DELAY=5000      # 5 secunde pentru muzică
```

### 🔍 Ce Se Validează

✅ **Request Creation** - Se creează document în `generationRequests`  
✅ **Payment Simulation** - Se setează `paymentStatus: "success"`  
✅ **Generation Start** - Se declanșează `generationStarted: true`  
✅ **OpenAI Mock** - Se simulează generarea versurilor  
✅ **Suno Mock** - Se simulează generarea muzicii  
✅ **Completion** - Se generează URL de download  
✅ **Status Updates** - Toate câmpurile sunt actualizate corect  

### 📊 Metrici Local

- **Total Generation Time** - Timpul complet de la request la download
- **Stage Breakdown** - Progresul prin fiecare etapă
- **Success Rate** - Procentajul de request-uri complete
- **Performance** - Throughput și response time

---

## 📁 Structura Proiectului

```
scripts/stress-testing/
├── src/
│   ├── createTestAccounts.ts    # Creare conturi de test
│   ├── stressTest.ts           # Script principal de stress testing
│   ├── testDataGenerator.ts    # Generare date de test
│   ├── performanceMonitor.ts   # Monitorizare performanță
│   ├── config.ts              # Configurare staging + local
│   ├── types.ts               # Tipuri TypeScript
│   ├── utils.ts               # Funcții utilitare
│   ├── 🆕 mockServices.ts     # Servicii simulate OpenAI/Suno
│   └── 🆕 localBackendClient.ts # Client pentru emulator local
├── output/                    # Rezultate testare
├── package.json
├── tsconfig.json
├── env.example               # Exemplu configurare staging
├── 🆕 env.local.example      # Exemplu configurare locală
└── README.md
```

## 🚀 Instalare și Configurare

### 1. Instalare dependențe

```bash
cd scripts/stress-testing
npm install
```

### 2. Configurare variabile de mediu

#### Pentru Staging (Original)
```bash
cp env.example .env
```

#### Pentru Local (NOU!)
```bash
cp env.local.example .env.local
```

### 3. Obținere Service Account

Pentru a crea conturile de test, ai nevoie de un Firebase Service Account:

1. Mergi la [Firebase Console](https://console.firebase.google.com)
2. Selectează proiectul `manele-io-test`
3. Mergi la **Project Settings** > **Service Accounts**
4. Click **Generate New Private Key**
5. Descarcă fișierul JSON și copiază valorile în `.env` sau `.env.local`

## 📋 Utilizare

### 🏠 Testare Locală (Recomandată pentru Dezvoltare)

```bash
# 1. Pornește emulatorul
firebase emulators:start

# 2. Test rapid local
npm run local-test

# 3. Test complet local
npm run local-full-test 25
```

### 🌐 Testare Staging (Pentru Production Testing)

```bash
# Test complet pe staging
npm run full-test 50
```

### Comenzi Disponibile

```bash
# 🎯 WORKFLOW COMPLET (Recomandat)
npm run local-full-test [N]        # Local: creare conturi + stress test + cleanup
npm run full-test [N]              # Staging: creare conturi + stress test + cleanup

# Comenzi individuale
npm run local-create-accounts      # Local: creare conturi de test
npm run local-stress-test [N]      # Local: stress testing cu N request-uri
npm run local-clean-accounts       # Local: ștergere conturi de test

npm run create-accounts            # Staging: creare conturi de test
npm run stress-test [N]            # Staging: stress testing cu N request-uri
npm run clean-accounts             # Staging: ștergere conturi de test

# Utilitare
npm run build               # Build TypeScript
npm run clean               # Clean build directory
```

### 🚀 Utilizare Rapidă

Pentru un test local complet cu o singură comandă:

```bash
# Test local cu 10 request-uri (default)
npm run local-test

# Test local cu 25 request-uri
npm run local-test-medium

# Test local cu 50 request-uri
npm run local-test-large
```

## 📊 Monitorizare și Rapoarte

### Logs în Timp Real

Scripturile afișează logs detaliate în timp real:
- Progresul creării conturilor
- Status-ul request-urilor de generare
- Metrici de performanță pentru fiecare etapă
- Erori și warning-uri

### Fișiere de Output

Rezultatele sunt salvate în folderul `output/`:

- `test-accounts-{timestamp}.json` - Rezultate complete creare conturi
- `successful-accounts-{timestamp}.json` - Doar conturile create cu succes
- `stress-test-results-{timestamp}.json` - Rezultate stress testing
- `performance-report-{timestamp}.json` - Raport de performanță
- `🆕 collection-stats-{timestamp}.json` - Statistici colecție (local)

### Metrici Monitorizate

- **Timp de răspuns** - Latency pentru fiecare request
- **Rate de succes** - Procentaj request-uri reușite
- **Throughput** - Request-uri per secundă
- **Rate de eroare** - Procentaj request-uri eșuate
- **🆕 Total Generation Time** - Timpul complet de generare (local)
- **🆕 Stage Breakdown** - Progresul prin fiecare etapă (local)

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

### Mock Services (Local)

- **OpenAI Mock** - Simulează generarea versurilor cu delay realist
- **Suno Mock** - Simulează generarea muzicii cu delay realist
- **Payment Mock** - Simulează procesarea plăților
- **Configurabil** - Poți ajusta delays-urile în `.env.local`

### Cleanup

Pentru a șterge conturile de test după testare:

```bash
# Local cleanup
npm run local-clean-accounts

# Staging cleanup
npm run clean-accounts
```

## 🔧 Dezvoltare

### Build

```bash
npm run build
```

### Development

```bash
npm run dev
```

### Watch Mode

```bash
npm run watch
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

### 🆕 Generation Time (Local)

- **< 10s** - Excelent
- **10-20s** - Acceptabil
- **> 20s** - Necesită optimizare

## 🚨 Troubleshooting

### Erori Comune

1. **Firebase Authentication Error**
   - Verifică configurarea Service Account
   - Asigură-te că proiectul este corect

2. **Emulator Connection Error**
   - Verifică că emulatorul rulează pe porturile corecte
   - Verifică variabilele de mediu din `.env.local`

3. **Rate Limiting**
   - Reduce `REQUESTS_PER_SECOND` în `.env.local`
   - Mărește delay-ul între batch-uri

4. **Memory Issues**
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
2. Consultă documentația Firebase Emulator
3. Contactează echipa de dezvoltare

## 🔒 Securitate

- **Nu commita** fișierul `.env` sau `.env.local`
- **Folosește doar** conturi de test
- **Testează local** cu emulatorul pentru dezvoltare
- **Testează staging** pentru validarea pre-production
- **Șterge conturile** de test după utilizare

## 🎉 Avantaje Testare Locală

1. **Dezvoltare Rapidă** - Testezi modificările imediat
2. **Flow Complet** - Validezi toată logica de business
3. **Mock Services** - Nu apelezi servicii externe reale
4. **Performance Real** - Măsori performanța reală a logicii
5. **Isolare** - Nu afectezi datele de staging/production
6. **Flexibilitate** - Poți simula erori, delays, etc.
