# Manele IO Web App

A React web application for generating Romanian manele songs using AI. This is the web version of the React Native mobile app.

## Features

- **AI-Powered Song Generation**: Create custom manele songs using OpenAI and music generation APIs
- **Multiple Styles**: Choose from 8 different manele styles (Jale, Petrecere, Comerciale, etc.)
- **Easy & Complex Modes**: Simple mode for quick generation or complex mode with detailed customization
- **Dedications & Donations**: Add personal dedications and donation amounts to songs
- **Real-time Audio Player**: Play generated songs directly in the browser
- **Firebase Integration**: Authentication and cloud functions for backend processing
- **Responsive Design**: Works on desktop, tablet, and mobile devices

## Tech Stack

- **Frontend**: React 19, React Router DOM
- **Styling**: CSS3 with custom design system
- **Backend**: Firebase Functions, Firestore
- **Authentication**: Firebase Auth (Anonymous)
- **AI Services**: OpenAI GPT-4, Third-party Music API
- **State Management**: React Hooks, Local Storage
- **Audio**: Web Audio API

## Project Structure

```
web-app/
├── public/                 # Static assets
├── src/
│   ├── components/         # Reusable UI components
│   │   ├── auth/          # Authentication components
│   │   └── ui/            # UI components (Button, Input, Switch)
│   ├── hooks/             # Custom React hooks
│   ├── pages/             # Page components
│   ├── services/          # Firebase services
│   ├── styles/            # CSS files
│   ├── utils/             # Utility functions
│   ├── constants/         # Application constants
│   └── api/               # API functions
├── package.json
└── README.md
```

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn
- Firebase project setup

### Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   cd web-app
   npm install
   ```

3. Create a `.env` file in the web-app directory:
   ```env
   REACT_APP_FIREBASE_API_KEY=your_firebase_api_key
   REACT_APP_FIREBASE_PROJECT_ID=your_project_id
   REACT_APP_FIREBASE_AUTH_DOMAIN=your_auth_domain
   REACT_APP_FIREBASE_STORAGE_BUCKET=your_storage_bucket
   REACT_APP_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
   REACT_APP_FIREBASE_APP_ID=your_app_id
   REACT_APP_USE_FIREBASE_EMULATOR=false
   ```

4. Start the development server:
   ```bash
   npm start
   ```

5. Open [http://localhost:3000](http://localhost:3000) in your browser

## Usage

### Basic Flow

1. **Select Mode**: Choose between Easy (simple) or Complex (detailed) mode
2. **Enter Song Details**: 
   - Song name (required)
   - Song details (complex mode only)
   - Choose manele style
3. **Add Customizations** (complex mode):
   - Dedications (from/to with optional message)
   - Donation amounts
4. **Generate**: Click "Plateste" to start generation
5. **Wait & Play**: Monitor progress and play the generated song

### Styles Available

- Jale (Guta/Salam Vechi)
- De Petrecere (Bem 7 zile)
- Comerciale (BDLP)
- Lautaresti
- Muzica Populara
- Manele live
- De Opulenta
- Orientale

## Development

### Available Scripts

- `npm start` - Start development server
- `npm build` - Build for production
- `npm test` - Run tests
- `npm eject` - Eject from Create React App

### Code Style

- Use functional components with hooks
- Follow React best practices
- Use CSS modules or styled-components for styling
- Implement proper error handling
- Add loading states for better UX

### Firebase Setup

1. Create a Firebase project
2. Enable Authentication (Anonymous)
3. Set up Firestore database
4. Deploy Firebase Functions from the parent directory
5. Configure security rules

## Deployment

### Build for Production

```bash
npm run build
```

### Deploy to Firebase Hosting

```bash
npm install -g firebase-tools
firebase login
firebase init hosting
firebase deploy
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License.

## Support

For support, please open an issue in the repository or contact the development team.
