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
# PrivaShield

PrivaShield is an advanced, privacy-first mobile application engineered to protect personal images from AI-driven manipulation, facial recognition scanning, and unauthorized exploitation. By integrating client-side image cloaking and an intelligent backend analyzer, PrivaShield empowers users to secure their digital identity before sharing media online.

---

## 🚀 Architecture & Tech Stack

PrivaShield utilizes a unified workspace structure combining a high-performance cross-platform mobile interface, a local proxy server, and an async security analysis ecosystem.

- **Frontend:** React Native (TypeScript) with Expo framework, featuring a modular component architecture (`/components`, `/hooks`, `/lib`).
- **Backend API:** Python 3.10+ FastAPI framework managing core cryptographic functions and data persistence.
- **Security Lab UI:** Streamlit application integrated into the ecosystem for advanced privacy protection metrics and dark-themed analytics.
- **Proxy/Routing Layer:** Node.js (`proxy-server.js`) to handle secure API request routing and bypass local media upload bottlenecks.

---

## 🛠️ Repository Structure

Based on your repository snapshot, here is how the core architecture is mapped:

```text
Privashield/
├── .claude/               # AI agent configuration profiles
├── .streamlit/            # Configurations for the Streamlit security analyzer
├── analyzer/              # Privacy protection analyzer modules (Dark Theme)
├── app/                   # Mobile core logic & application state management
├── assets/images          # App icons, static graphics, and UI assets
├── backend/               # Python FastAPI core backend service folders
├── components/            # Reusable React Native UI components (Vault, Upload, etc.)
├── constants/             # Global configurations, thematic tokens, and API endpoints
├── hooks/                 # Custom React hooks for lifecycle and state tracking
├── lib/                   # Utility scripts and image migration helpers
├── scripts/               # Automation and build assistance scripts
├── AGENTS.md              # Agentic workflow tracking and setup guides
├── CLAUDE.md              # Project-specific AI assistant instructions
├── app.json               # Expo configuration manifest
├── eslint.config.js       # Linting rules for TypeScript/JavaScript quality
├── google-services.json   # Firebase / Google API integration config
├── main.py                # FastAPI entry point & Streamlit integration router
├── metro.config.js        # Metro bundler configuration optimizing asset handling
├── package.json           # Frontend Node modules and app build dependency scripts
├── proxy-server.js        # Dedicated proxy server routing image uploads cleanly
├── pyproject.toml         # Python tool dependencies configuration
└── tsconfig.json          # TypeScript compilation settings
