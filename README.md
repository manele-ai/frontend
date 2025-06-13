# Welcome to your Expo app 👋

This is an [Expo](https://expo.dev) project created with [`create-expo-app`](https://www.npmjs.com/package/create-expo-app).

## Get started

1. Install dependencies

   ```bash
   npm install
   ```

2. Start the app

   ```bash
   npx expo start
   ```

In the output, you'll find options to open the app in a

- [development build](https://docs.expo.dev/develop/development-builds/introduction/)
- [Android emulator](https://docs.expo.dev/workflow/android-studio-emulator/)
- [iOS simulator](https://docs.expo.dev/workflow/ios-simulator/)
- [Expo Go](https://expo.dev/go), a limited sandbox for trying out app development with Expo

You can start developing by editing the files inside the **app** directory. This project uses [file-based routing](https://docs.expo.dev/router/introduction).

## Get a fresh project

When you're ready, run:

```bash
npm run reset-project
```

This command will move the starter code to the **app-example** directory and create a blank **app** directory where you can start developing.

## Learn more

To learn more about developing your project with Expo, look at the following resources:

- [Expo documentation](https://docs.expo.dev/): Learn fundamentals, or go into advanced topics with our [guides](https://docs.expo.dev/guides).
- [Learn Expo tutorial](https://docs.expo.dev/tutorial/introduction/): Follow a step-by-step tutorial where you'll create a project that runs on Android, iOS, and the web.

## Join the community

Join our community of developers creating universal apps.

- [Expo on GitHub](https://github.com/expo/expo): View our open source platform and contribute.
- [Discord community](https://chat.expo.dev): Chat with Expo users and ask questions.


# Project structure
├── app/                   # Routes
│
├── components/            # Reusable UI components
│
├── services/            # Backend services
│   └── firebase/        # Firebase service integration, avoid importing firebase functions directly in components, instead import from this folder
│
├── assets/              # Static assets (images, fonts, etc.)
├── constants/           # Application constants and configurations
├── hooks/              # Custom React hooks
├── scripts/            # Utility and build scripts
├── functions/          # Firebase backend
│
├── app.config.ts       # Expo configuration
├── App.js             # Root React component
├── tsconfig.json      # TypeScript configuration
├── package.json       # Project dependencies and scripts
└── firebase.json      # Firebase configuration


# Testing Locally with Firebase
## Install

Install Node 18.0.8.

Install expo app:
```sh
# In project root
npm install
```

```sh
firebase login
```

Install and build firebase functions:
```sh
cd functions
npm install
# If you are using TypeScript, compile your functions:
npm run build
cd ..
```

## Run
To start firebase emulators:
```sh
firebase emulators:start
```
Note: Don't name .env keys with FIREBASE_ as they are reserved will cause stupid fckin error


Start expo app:
```sh
npm run start # In project root
```