# Firebase Functions Environment Setup

## Pași pentru configurarea backend-ului:

### 1. Creează fișierul .env în directorul functions/

```bash
cd functions
touch .env
```

### 2. Adaugă următoarele variabile în .env:

```env
# OpenAI API Key (required for lyrics generation)
OPENAI_API_KEY=your_openai_api_key_here

# Third-party Music API (required for music generation)
THIRD_PARTY_API_BASE_URL=https://api.examplemusic.com/api/v1
THIRD_PARTY_API_KEY=your_third_party_api_key_here

# Firebase Storage Bucket (for storing generated MP3 files)
MP3_STORAGE_BUCKET=manele-ai-dev-fa776.appspot.com
```

### 3. Obține API Keys:

#### OpenAI API Key:
1. Mergi la [OpenAI Platform](https://platform.openai.com/api-keys)
2. Creează un cont sau loghează-te
3. Creează un API key nou
4. Copiază cheia în .env

#### Third-party Music API:
- Aceasta este probabil Suno, Mubert sau alt serviciu de generare muzică
- Obține cheia de la furnizorul tău de servicii
- Înlocuiește URL-ul cu cel corect

### 4. Instalează dependențele:

```bash
cd functions
npm install
```

### 5. Compilează TypeScript:

```bash
npm run build
```

### 6. Pornește emulatorul Firebase:

```bash
# Din directorul root al proiectului
firebase emulators:start
```

Sau doar functions:
```bash
cd functions
npm run serve
```

## Structura backend-ului:

```
functions/
├── src/
│   ├── handlers/          # Logică principală
│   │   ├── generateSong.ts
│   │   ├── getGenerationStatus.ts
│   │   └── downloadSong.ts
│   ├── api/              # Integrări API
│   │   ├── openai-api.ts
│   │   └── music-api.ts
│   ├── data/prompts/     # Template-uri pentru stiluri
│   └── index.ts          # Entry point
├── package.json
└── tsconfig.json
```

## Funcții disponibile:

- `generateSong` - Generează o piesă nouă
- `getGenerationStatus` - Verifică statusul generării
- `downloadSong` - Descarcă piesa generată
- `onSongCreated` - Trigger la crearea unei piese
- `onUserCreated` - Trigger la crearea unui user 