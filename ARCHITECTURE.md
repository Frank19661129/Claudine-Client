# PAI (Pepper) Web Client - Architecture Document

**Version:** 3.0
**Date:** 2024-12-25
**Platform:** Web (React 19 + TypeScript + Vite)
**External Name:** Pepper
**Internal Name:** PAI (Personal AI)

---

## Table of Contents

1. [Architecture Principles](#architecture-principles)
2. [System Overview](#system-overview)
3. [Layout System](#layout-system)
4. [API Communication Layer](#api-communication-layer)
5. [Testing & Development Guidelines](#testing--development-guidelines)

---

## 1. Architecture Principles

### 1.1 Layered Architecture

The application follows a strict layered architecture:

```
┌────────────────────────────────────────┐
│        PRESENTATION LAYER              │
│  • Pages (React components)            │
│  • UI components                       │
│  • State management (Zustand stores)   │
└───────────────┬────────────────────────┘
                │ uses
┌───────────────▼────────────────────────┐
│         API CLIENT LAYER               │
│  • API client (axios)                  │
│  • Request/response typing             │
│  • Authentication handling             │
│  • Error transformation                │
└───────────────┬────────────────────────┘
                │ calls
┌───────────────▼────────────────────────┐
│         BACKEND API LAYER              │
│  • FastAPI server (pai-server)         │
│  • Business logic                      │
│  • MCP service orchestration           │
└───────────────┬────────────────────────┘
                │ uses
┌───────────────▼────────────────────────┐
│          MCP SERVICES                  │
│  • Microsoft Calendar MCP              │
│  • Google Calendar MCP                 │
│  • Other domain services               │
└────────────────────────────────────────┘
```

### 1.2 Core Principle: No Direct External Service Calls

**RULE:** The web client MUST NEVER make direct calls to external services or MCP servers.

**Why:**
1. **Security:** API layer handles authentication, rate limiting, and input validation
2. **Maintainability:** Service endpoints can change without updating client code
3. **Testability:** Can mock API layer for testing
4. **Consistency:** All requests go through same authentication/error handling
5. **CORS:** Avoids mixed content and CORS issues

---

## 2. System Overview

### 2.1 Technology Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| **UI Framework** | React 19 | Component-based UI |
| **Language** | TypeScript 5.x | Type safety |
| **Build Tool** | Vite 7.x | Fast development & bundling |
| **State Management** | Zustand | Lightweight state |
| **HTTP Client** | Axios | API communication |
| **Router** | React Router 7.x | Client-side routing |
| **Styling** | Tailwind CSS 3.x | Utility-first CSS |
| **Mobile** | Capacitor | Native mobile builds |

### 2.2 Project Structure

```
pai-client/
├── src/
│   ├── components/           # Reusable UI components
│   │   ├── v2/               # V2 layout components
│   │   │   ├── TopBar.tsx    # Navy blue top bar with Pepper logo
│   │   │   └── Sidebar.tsx   # Left sidebar with navigation icons
│   │   ├── Header.tsx        # Legacy header (v1 only)
│   │   └── Logo.tsx          # Pepper logo with avatar
│   ├── layouts/
│   │   └── MainLayout.tsx    # Main app layout (TopBar + Sidebar + Content)
│   ├── pages/                # Page components
│   │   ├── Login.tsx         # Login page (standalone, no layout)
│   │   ├── Register.tsx      # Registration page (standalone)
│   │   └── v2/               # Version 2 pages (current/default)
│   │       ├── ChatPage.tsx
│   │       ├── TasksPage.tsx
│   │       ├── NotesPage.tsx
│   │       ├── InboxPage.tsx
│   │       ├── MonitorPage.tsx
│   │       └── SettingsPage.tsx
│   ├── services/
│   │   ├── api/
│   │   │   └── client.ts     # API client (SINGLE SOURCE OF TRUTH)
│   │   └── sse/              # Server-Sent Events
│   ├── stores/               # Zustand state stores
│   ├── styles/
│   │   └── pepper-theme.css  # Pepper theme (Tailwind + custom)
│   ├── types/                # TypeScript types
│   └── main.tsx              # Application entry
├── public/
│   ├── favicon.jpg           # Pepper favicon
│   ├── pepper-avatar.jpg     # Pepper avatar image
│   └── manifest.json         # PWA manifest
├── .env                      # Environment variables
├── vite.config.ts            # Vite configuration
├── capacitor.config.ts       # Capacitor mobile config
└── ARCHITECTURE.md           # This document
```

---

## 3. Layout System

### 3.1 MainLayout (Paperless-ngx inspired)

The application uses a **MainLayout** component that wraps all authenticated pages. This layout is inspired by Paperless-ngx design principles.

```
┌──────────────────────────────────────────────────────────┐
│                      TopBar                               │
│  [Pepper Logo + Avatar]              [User Avatar ▾]     │
├────────┬─────────────────────────────────────────────────┤
│        │                                                  │
│  Side  │              Content Area                        │
│  bar   │                                                  │
│        │         (Page content renders here)              │
│  📥    │                                                  │
│  💬    │                                                  │
│  📋    │                                                  │
│  📝    │                                                  │
│  📊    │                                                  │
│  ⚙️    │                                                  │
│        │                                                  │
└────────┴─────────────────────────────────────────────────┘
```

**Components:**

| Component | File | Description |
|-----------|------|-------------|
| **MainLayout** | `src/layouts/MainLayout.tsx` | Wrapper with TopBar + Sidebar + Content |
| **TopBar** | `src/components/v2/TopBar.tsx` | Navy blue header with logo and user menu |
| **Sidebar** | `src/components/v2/Sidebar.tsx` | Left navigation with icon buttons |

### 3.2 Route Structure

```typescript
// App.tsx - Route configuration
<Route path="/chat" element={<MainLayout><ChatPage /></MainLayout>} />
<Route path="/tasks" element={<MainLayout><TasksPage /></MainLayout>} />
<Route path="/notes" element={<MainLayout><NotesPage /></MainLayout>} />
<Route path="/inbox" element={<MainLayout><InboxPage /></MainLayout>} />
<Route path="/monitor" element={<MainLayout><MonitorPage /></MainLayout>} />
<Route path="/settings" element={<MainLayout><SettingsPage /></MainLayout>} />

// Standalone pages (no MainLayout)
<Route path="/login" element={<Login />} />
<Route path="/register" element={<Register />} />
```

### 3.3 Page Template

All v2 pages follow this structure:

```tsx
export const ExamplePage: FC = () => {
  return (
    <div className="content-body p-6">
      {/* Page Header */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-light text-navy">Page Title</h1>
        <button>Action Button</button>
      </div>

      {/* Page Content */}
      <div className="max-w-4xl">
        {/* Content here */}
      </div>
    </div>
  );
};
```

### 3.4 Branding

| Element | Value |
|---------|-------|
| **External Name** | Pepper |
| **Internal Name** | PAI (Personal AI) |
| **Logo** | Pepper avatar + "Pepper" text |
| **Favicon** | Pepper character (red hair ponytail) |
| **Theme Colors** | Navy #002366, Silver #ececec, Lenovo Red #E2231A |
| **Copyright** | "Pepper © is bedacht, gemaakt en wordt onderhouden door Franklab" |

---

## 4. API Communication Layer

### 4.1 API Client (`src/services/api/client.ts`)

**Purpose:** Single centralized client for ALL backend communication.

**Responsibilities:**
- HTTP request handling via axios
- Authentication token management (JWT)
- Request/response transformation
- Error handling
- Type safety

### 4.2 Environment Configuration

**File:** `.env`

```bash
# API Base URL
VITE_API_URL=http://100.99.206.31:8003/api/v1
```

### 4.3 API Endpoints Reference

**Backend API:** `http://100.99.206.31:8003/api/v1`

#### Authentication
```
POST   /auth/login
POST   /auth/register
GET    /auth/me
POST   /auth/logout
```

#### Calendar OAuth
```
POST   /calendar/oauth/microsoft/start
POST   /calendar/oauth/microsoft/poll
POST   /calendar/oauth/google/start
POST   /calendar/oauth/google/poll
GET    /calendar/oauth/connected
POST   /calendar/oauth/{provider}/primary
DELETE /calendar/oauth/{provider}
```

#### Conversations
```
GET    /conversations
POST   /conversations
GET    /conversations/{id}
POST   /conversations/{id}/messages
DELETE /conversations/{id}
```

---

## 5. Testing & Development Guidelines

### 5.1 Development Workflow

**When adding new API features:**

1. **Backend First:** Implement endpoint in FastAPI server
2. **API Client:** Add method to `src/services/api/client.ts`
3. **UI Integration:** Use API client in pages/components

### 5.2 Code Review Checklist

Before merging any PR, verify:

- [ ] No hardcoded IP addresses or URLs (except in `.env`)
- [ ] All external calls go through `src/services/api/client.ts`
- [ ] No direct `fetch()` calls to MCP services
- [ ] All API methods have proper TypeScript typing
- [ ] Error handling implemented
- [ ] Pages use MainLayout wrapper (except login/register)
- [ ] Consistent styling with pepper-theme.css

---

## Document History

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | 2024-12-01 | Initial document |
| 2.0 | 2024-12-08 | Added API layer principles, no direct MCP calls policy |
| 3.0 | 2024-12-25 | Renamed to PAI/Pepper, added MainLayout documentation, updated tech stack |

---

**Last Updated:** 2024-12-25
**Maintainer:** Franklab (https://www.franklab.nl)
