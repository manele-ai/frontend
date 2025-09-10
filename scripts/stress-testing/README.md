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
npm run concurrent-real-generation -- 25
```

### 📋 Comenzi Local

```bash
# Test unitar (1 user, 1 generare)
npm run single-real-generation

# Test concurent (N users simultan)
npm run concurrent-real-generation -- 10

# Exemple cu numere diferite
npm run concurrent-real-generation -- 5    # 5 users
npm run concurrent-real-generation -- 25   # 25 users
npm run concurrent-real-generation -- 50   # 50 users

# Cu timeout personalizat (opțional)
npm run concurrent-real-generation -- 10 300000  # 10 users, 5 min timeout
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
│   ├── concurrentRealGeneration.ts  # Test concurent cu N users
│   ├── singleRealGeneration.ts     # Test unitar (1 user, 1 generare)
│   ├── testDataGenerator.ts        # Generare date de test
│   ├── config.ts                   # Configurare staging + local
│   ├── types.ts                    # Tipuri TypeScript
│   └── utils.ts                    # Funcții utilitare
├── output/                         # Rezultate testare
├── package.json
├── tsconfig.json
├── env.example                     # Exemplu configurare staging (vechi)
├── env.local.example               # Exemplu configurare locală
├── env.staging.example             # Exemplu configurare staging (nou)
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

#### Pentru Local
```bash
cp env.local.example .env.local
```

#### Pentru Staging (NOU!)
```bash
cp env.staging.example .env_staging
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

# 2. Test unitar pentru debug
npm run single-real-generation

# 3. Test concurent cu 25 users
npm run concurrent-real-generation -- 25
```

### 🌐 Testare Staging (Pentru Production Testing)

```bash
# 1. Configurează staging (opțional - dacă nu ai .env_staging)
cp env.staging.example .env_staging
# Editează .env_staging cu valorile tale

# 2. Test unitar pe staging
npm run single-staging

# 3. Test concurent pe staging cu 25 users
npm run concurrent-staging -- 25
```

### Comenzi Disponibile

```bash
# 🎯 TESTE LOCAL (Emulator)
npm run single-real-generation                    # Test unitar local (1 user, 1 generare)
npm run concurrent-real-generation -- [N]         # Test concurent local (N users simultan)

# 🌐 TESTE STAGING (Backend Real)
npm run single-staging                            # Test unitar staging (1 user, 1 generare)
npm run concurrent-staging -- [N]                 # Test concurent staging (N users simultan)

# Exemple practice
npm run concurrent-real-generation -- 5           # Test rapid local cu 5 users
npm run concurrent-real-generation -- 25          # Test mediu local cu 25 users
npm run concurrent-staging -- 10                  # Test staging cu 10 users
npm run concurrent-staging -- 50                  # Test intens staging cu 50 users

# Utilitare
npm run build               # Build TypeScript
npm run clean               # Clean build directory
npm run watch               # Watch mode pentru dezvoltare
```

### 🚀 Utilizare Rapidă

Pentru teste rapide cu o singură comandă:

```bash
# 🏠 LOCAL (Emulator)
npm run concurrent-real-generation -- 5           # Test rapid local cu 5 users
npm run concurrent-real-generation -- 25          # Test mediu local cu 25 users
npm run single-real-generation                    # Test unitar local pentru debug

# 🌐 STAGING (Backend Real)
npm run concurrent-staging -- 10                 # Test staging cu 10 users
npm run concurrent-staging -- 25                 # Test mediu staging cu 25 users
npm run single-staging                           # Test unitar staging pentru debug
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

Testele noi includ cleanup automat la sfârșitul testului. Nu mai este nevoie de comenzi separate de cleanup.

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
