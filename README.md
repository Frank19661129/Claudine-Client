# Claudine Client

**Cross-platform AI assistant client for Web, iOS, Android, and Windows PWA**

Built with React 18, TypeScript, Vite, and Capacitor for true write-once, run-everywhere development.

## 🎯 Platform Support

| Platform | Technology | Status |
|----------|-----------|---------|
| **Web** | React + Vite | ✅ Active Development |
| **iOS** | Capacitor | 🔜 Coming Soon |
| **Android** | Capacitor | 🔜 Coming Soon |
| **Windows** | PWA | 🔜 Coming Soon |

## 🏗️ Architecture

```
claudine-client/
├── src/                    # Shared React code (~90% reusable)
│   ├── components/
│   │   ├── auth/          # Login, Register
│   │   ├── chat/          # Conversations, Messages
│   │   └── layout/        # App shell
│   ├── stores/            # Zustand state management
│   ├── services/
│   │   ├── api/           # API client (Axios)
│   │   └── sse/           # Server-Sent Events
│   ├── pages/             # Route pages
│   ├── types/             # TypeScript definitions
│   └── hooks/             # Custom React hooks
├── public/                # Static assets & PWA manifest
├── ios/                   # iOS native project (Capacitor)
├── android/               # Android native project (Capacitor)
└── capacitor.config.ts    # Multi-platform config
```

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- npm or yarn
- For iOS: macOS with Xcode
- For Android: Android Studio

### Install Dependencies

```bash
npm install
```

### Development

```bash
# Web development (hot reload)
npm run dev
# Opens http://localhost:5173

# Build for production
npm run build

# Preview production build
npm run preview
```

### Mobile Development

#### iOS

```bash
# Add iOS platform (first time only)
npm run build
npx cap add ios

# Open in Xcode
npx cap open ios

# Sync changes
npm run build
npx cap sync ios
```

#### Android

```bash
# Add Android platform (first time only)
npm run build
npx cap add android

# Open in Android Studio
npx cap open android

# Sync changes
npm run build
npx cap sync android
```

### Windows PWA

The app automatically works as a PWA on Windows:
1. Build: `npm run build`
2. Deploy to web server
3. Users click "Install" in Chrome/Edge
4. App appears on desktop as native app

## 📦 Tech Stack

### Core
- **React 18** - UI framework
- **TypeScript** - Type safety
- **Vite** - Fast build tool
- **Capacitor** - Native app wrapper

### State & Routing
- **Zustand** - Lightweight state management
- **React Router** - Client-side routing

### Styling
- **TailwindCSS** - Utility-first CSS
- **PostCSS** - CSS processing

### API & Data
- **Axios** - HTTP client
- **Server-Sent Events** - Real-time streaming

### Platform Detection

```typescript
import { Capacitor } from '@capacitor/core';

const platform = Capacitor.getPlatform();
// Returns: 'web' | 'ios' | 'android'

if (Capacitor.isNativePlatform()) {
  // Native-specific code
}
```

## 🎨 Features

### Current
- ✅ Modern React + TypeScript setup
- ✅ Hot module replacement (HMR)
- ✅ TailwindCSS styling
- ✅ Multi-platform configuration

### In Progress
- 🚧 Authentication (JWT)
- 🚧 Chat interface (WhatsApp-style)
- 🚧 AI conversation with streaming
- 🚧 Command routing (#calendar, #note, #scan)

### Planned
- 📅 Calendar integration (Google + Microsoft)
- 📝 Note taking
- 📸 Document scanning (mobile camera)
- 🎤 Voice input/output
- 🔔 Push notifications (mobile)
- 💾 Offline support (PWA)

## 🔌 API Integration

Connects to [Claudine Server](https://github.com/Frank19661129/Claudine-Server-v1):

```
Development:  http://localhost:8003/api/v1
Production:   https://api.claudine.app/api/v1 (TBD)
```

### API Endpoints Used
- `POST /auth/register` - User registration
- `POST /auth/login` - Authentication
- `GET /conversations` - List conversations
- `POST /conversations/{id}/messages/stream` - AI chat (SSE)
- `POST /calendar/events` - Create calendar events

## 📱 Platform-Specific Features

### iOS
- Native navigation gestures
- Face ID / Touch ID authentication
- Camera access for document scanning
- Push notifications (APNs)

### Android
- Material Design components
- Fingerprint authentication
- Camera access for document scanning
- Push notifications (FCM)

### Windows PWA
- Install to desktop (no store)
- Offline support
- System notifications
- Taskbar integration

## 🛠️ Development Scripts

```bash
npm run dev              # Web dev server
npm run build            # Production build
npm run preview          # Preview production build
npm run lint             # ESLint
npx cap sync             # Sync web → native
npx cap run ios          # Run on iOS simulator
npx cap run android      # Run on Android emulator
```

## 📐 Project Structure Conventions

### Components
```typescript
// Use functional components with TypeScript
import { FC } from 'react';

interface Props {
  message: string;
}

export const MyComponent: FC<Props> = ({ message }) => {
  return <div>{message}</div>;
};
```

### State Management (Zustand)
```typescript
import { create } from 'zustand';

interface AuthState {
  user: User | null;
  token: string | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: null,
  login: async (email, password) => { /* ... */ },
  logout: () => set({ user: null, token: null }),
}));
```

### API Calls
```typescript
import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8003/api/v1',
});

// Use in components
const { data } = await api.get('/conversations');
```

## 🔐 Environment Variables

Create `.env.local`:

```bash
VITE_API_URL=http://localhost:8003/api/v1
VITE_APP_NAME=Claudine
```

## 🚢 Deployment

### Web (Vercel/Netlify)
```bash
npm run build
# Deploy dist/ folder
```

### iOS (App Store)
1. Build in Xcode
2. Archive & upload to App Store Connect
3. Submit for review

### Android (Play Store)
1. Build in Android Studio
2. Generate signed APK/AAB
3. Upload to Google Play Console

### Windows (PWA)
1. Deploy web build with HTTPS
2. Ensure manifest.json is configured
3. Users install via browser

## 📄 License

Private project - All rights reserved

## 🔗 Related Repositories

- **Server:** [Claudine-Server-v1](https://github.com/Frank19661129/Claudine-Server-v1)
- **Documentation:** [Claudine](https://github.com/Frank19661129/Claudine)

---

**Status:** 🚧 Active Development
**Version:** 0.1
**Last Updated:** 2025-11-14
