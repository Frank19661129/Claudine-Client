# PAI Client (Pepper)

**Cross-platform AI assistant client for Web, iOS, Android, and Windows PWA**

Built with React 19, TypeScript, Vite, and Capacitor for true write-once, run-everywhere development.

- **External Name:** Pepper
- **Internal Name:** PAI (Personal AI)

## Platform Support

| Platform | Technology | Status |
|----------|-----------|---------|
| **Web** | React + Vite | Active Development |
| **iOS** | Capacitor | Coming Soon |
| **Android** | Capacitor | Coming Soon |
| **Windows** | PWA | Coming Soon |

## Architecture

See [ARCHITECTURE.md](./ARCHITECTURE.md) for detailed documentation.

```
pai-client/
├── src/
│   ├── components/         # Reusable UI components
│   │   └── v2/             # V2 layout (TopBar, Sidebar)
│   ├── layouts/            # Page layouts (MainLayout)
│   ├── pages/              # Route pages
│   │   └── v2/             # V2 pages (current)
│   ├── stores/             # Zustand state management
│   ├── services/
│   │   ├── api/            # API client (Axios)
│   │   └── sse/            # Server-Sent Events
│   ├── styles/             # Pepper theme (Tailwind)
│   └── types/              # TypeScript definitions
├── public/                 # Static assets & PWA manifest
├── ios/                    # iOS native project (Capacitor)
├── android/                # Android native project (Capacitor)
└── capacitor.config.ts     # Multi-platform config
```

## Quick Start

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

### Docker

```bash
# Build and run with Docker
docker-compose up -d

# View logs
docker-compose logs -f pai-client
```

## Tech Stack

### Core
- **React 19** - UI framework
- **TypeScript 5.x** - Type safety
- **Vite 7.x** - Fast build tool
- **Capacitor** - Native app wrapper

### State & Routing
- **Zustand** - Lightweight state management
- **React Router 7.x** - Client-side routing

### Styling
- **TailwindCSS 3.x** - Utility-first CSS
- **Pepper Theme** - Custom theme (Navy + Silver + Red)

### API & Data
- **Axios** - HTTP client
- **Server-Sent Events** - Real-time streaming

## Features

### Current
- Authentication (JWT)
- Chat interface with AI streaming
- Task management
- Notes
- Inbox
- Calendar integration (Microsoft 365, Google)
- Settings with OAuth device flow

### Planned
- Document scanning (mobile camera)
- Voice input/output
- Push notifications (mobile)
- Offline support (PWA)

## API Integration

Connects to [PAI Server](https://github.com/Frank19661129/pai-server):

```
Development:  http://100.99.206.31:8003/api/v1
Production:   TBD
```

## Environment Variables

Create `.env.local`:

```bash
VITE_API_URL=http://100.99.206.31:8003/api/v1
```

## Development Scripts

```bash
npm run dev              # Web dev server
npm run build            # Production build
npm run preview          # Preview production build
npm run lint             # ESLint
npx cap sync             # Sync web → native
npx cap run ios          # Run on iOS simulator
npx cap run android      # Run on Android emulator
```

## License

Private project - All rights reserved

## Related Repositories

- **Server:** [pai-server](https://github.com/Frank19661129/pai-server)

---

**Status:** Active Development
**Version:** 0.5 (Pepper Kerst 2025)
**Maintainer:** [Franklab](https://www.franklab.nl)
