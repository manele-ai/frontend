# Environment Switching for Stress Testing

Acest sistem permite comutarea ușoară între medii locale și staging pentru testarea de stres.

## 🏗️ Arhitectura

### **Local Environment (Dezvoltare)**
```
 Stress Test Script
    ↓ (HTTP Request)
🏠 Backend Local (localhost:5001)
    ↓ (testMode: true)
🔧 Business Logic (real)
    ↓ (testMode: true)
 Mock OpenAI (din script)
 Mock Suno (din script)
    ↓
🏠 Firestore Local (emulator)
```

### **Staging Environment (Testare)**
```
 Stress Test Script
    ↓ (HTTP Request)
🌐 Backend Staging (cloud functions)
    ↓ (testMode: true)
🔧 Business Logic (real)
    ↓ (testMode: true)
 Mock OpenAI (din script)
 Mock Suno (din script)
    ↓
🌐 Firestore Staging (real)
```

## 🔄 Comutarea între Medii

### **1. Folosind Script-ul Shell**

```bash
# Comută la local
source scripts/switch-env.sh local

# Comută la staging
source scripts/switch-env.sh staging
```

### **2. Folosind Variabile de Mediu**

```bash
# Pentru local
export TEST_ENVIRONMENT=local
export USE_EMULATOR=true

# Pentru staging
export TEST_ENVIRONMENT=staging
export USE_EMULATOR=false
```

### **3. În .env file**

```env
# Pentru local
TEST_ENVIRONMENT=local
USE_EMULATOR=true

# Pentru staging
TEST_ENVIRONMENT=staging
USE_EMULATOR=false
```

## 🚀 Comenzi de Testare

### **Pentru Local (Dezvoltare)**
```bash
# Teste rapide
npm run local-test              # 10 request-uri
npm run local-test-small        # 5 request-uri
npm run local-test-medium       # 25 request-uri
npm run local-test-large        # 50 request-uri

# Teste complete
npm run local-full-test         # Creare conturi + stress test + cleanup
```

### **Pentru Staging (Testare)**
```bash
# Teste rapide
npm run staging-test            # 10 request-uri
npm run staging-test-small      # 5 request-uri
npm run staging-test-medium     # 25 request-uri
npm run staging-test-large      # 50 request-uri

# Teste complete
npm run full-test               # Creare conturi + stress test + cleanup
```

## ⚙️ Configurația

### **Local Environment**
- **Backend**: `http://localhost:5001`
- **Firestore**: `127.0.0.1:8081` (emulator)
- **Auth**: `127.0.0.1:9099` (emulator)
- **Mock Services**: Din script (cu delays reali)

### **Staging Environment**
- **Backend**: `https://europe-central2-manele-io-test.cloudfunctions.net`
- **Firestore**: Production (real)
- **Auth**: Production (real)
- **Mock Services**: Din script (cu delays reali)

## 🎯 Avantajele Sistemului

✅ **Testezi backend-ul real** - logica de business, validări  
✅ **Nu consumi API-uri externe** - OpenAI, Suno nu se apelează  
✅ **Comutare ușoară** - doar schimbi variabila de mediu  
✅ **Mock-uri configurabile** - delays realiști  
✅ **Zero costuri externe** - doar mock-uri locale  
✅ **Testezi integrarea reală** - backend + Firestore  

## 🔧 Mock Services

### **OpenAI Mock**
- **Delay**: 2-5 secunde (configurabil)
- **Funcționalitate**: Generează versuri mock
- **Configurare**: `MOCK_OPENAI_DELAY` în `.env`

### **Suno Mock**
- **Delay**: 5-15 secunde (configurabil)
- **Funcționalitate**: Generează muzică mock
- **Configurare**: `MOCK_SUNO_DELAY` în `.env`

### **Payment Mock**
- **Delay**: 1-2 secunde
- **Funcționalitate**: Simulează procesarea plății
- **Configurare**: Automat când `testMode: true`

## 📋 Workflow de Testare

### **1. Dezvoltare Locală**
```bash
# 1. Pornește backend-ul local
cd /path/to/your/backend
npm start  # sau comanda ta

# 2. Pornește Firebase emulator
firebase emulators:start

# 3. Comută la local
source scripts/switch-env.sh local

# 4. Rulează testele
npm run local-test-medium
```

### **2. Testare pe Staging**
```bash
# 1. Comută la staging
source scripts/switch-env.sh staging

# 2. Rulează testele
npm run staging-test-medium
```

## 🚨 Troubleshooting

### **Backend nu răspunde**
```bash
# Verifică dacă rulează
curl http://localhost:5001/health

# Verifică portul
netstat -an | grep 5001
```

### **Emulator nu răspunde**
```bash
# Verifică dacă rulează
firebase emulators:start

# Verifică porturile
curl http://127.0.0.1:8081
curl http://127.0.0.1:9099
```

### **Erori de autentificare**
```bash
# Verifică configurația Firebase
firebase projects:list
firebase use manele-io-test
```

## 💡 Tips

1. **Pentru dezvoltare rapidă** - folosește local environment
2. **Pentru validarea pre-production** - folosește staging environment
3. **Mock-urile se execută în script** - nu în backend
4. **Delays-urile sunt configurabile** - ajustează în `.env`
5. **Backend-ul detectează `testMode`** - activează mock-urile

## 🔄 Următorii Pași

1. **Testează local** cu backend-ul tău
2. **Implementează mock-urile** în backend (opțional)
3. **Testează pe staging** cu backend-ul real
4. **Optimizează delays-urile** pentru performanță
5. **Implementează CI/CD** pentru testare automată
