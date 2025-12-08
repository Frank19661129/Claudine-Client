# Claudine Web Client - Architecture Document

**Version:** 2.0
**Date:** 2024-12-08
**Platform:** Web (React + TypeScript + Vite)

---

## Table of Contents

1. [Architecture Principles](#architecture-principles)
2. [System Overview](#system-overview)
3. [API Communication Layer](#api-communication-layer)
4. [Testing & Development Guidelines](#testing--development-guidelines)

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
│  • FastAPI server                      │
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

**✅ Correct:**
```typescript
// Client → API layer → MCP service
async startMicrosoftOAuth() {
  const { data } = await this.client.post('/calendar/oauth/microsoft/start');
  return data;
}
```

**❌ Incorrect:**
```typescript
// Client → Direct MCP service call
const response = await fetch('http://100.99.206.31:9001/auth/start', {
  method: 'POST',
});
```

**Why:**
1. **Security:** API layer handles authentication, rate limiting, and input validation
2. **Maintainability:** Service endpoints can change without updating client code
3. **Testability:** Can mock API layer for testing
4. **Consistency:** All requests go through same authentication/error handling
5. **CORS:** Avoids mixed content and CORS issues

**Exception for Testing:**
During **development/testing**, direct calls MAY be temporarily used, but MUST:
- Be clearly marked with comments: `// TEMPORARY: Direct MCP call for testing`
- Have a corresponding GitHub issue to implement proper API endpoint
- Be replaced with API layer call before merging to main

---

## 2. System Overview

### 2.1 Technology Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| **UI Framework** | React 18 | Component-based UI |
| **Language** | TypeScript 5.x | Type safety |
| **Build Tool** | Vite 7.x | Fast development & bundling |
| **State Management** | Zustand | Lightweight state |
| **HTTP Client** | Axios | API communication |
| **Router** | React Router 6.x | Client-side routing |
| **Styling** | Tailwind CSS | Utility-first CSS |

### 2.2 Project Structure

```
claudine-client/
├── src/
│   ├── components/           # Reusable UI components
│   ├── pages/                # Page components
│   │   ├── v1/               # Version 1 pages
│   │   └── v2/               # Version 2 pages (current)
│   ├── services/
│   │   ├── api/
│   │   │   └── client.ts     # API client (SINGLE SOURCE OF TRUTH)
│   │   └── sse/              # Server-Sent Events
│   ├── stores/               # Zustand state stores
│   ├── types/                # TypeScript types
│   └── main.tsx              # Application entry
├── .env                      # Environment variables
├── vite.config.ts            # Vite configuration
└── ARCHITECTURE.md           # This document
```

---

## 3. API Communication Layer

### 3.1 API Client (`src/services/api/client.ts`)

**Purpose:** Single centralized client for ALL backend communication.

**Responsibilities:**
- HTTP request handling via axios
- Authentication token management (JWT)
- Request/response transformation
- Error handling
- Type safety

**Example Structure:**
```typescript
class ApiClient {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8003/api/v1',
      headers: { 'Content-Type': 'application/json' },
    });

    // Request interceptor: add auth token
    this.client.interceptors.request.use((config) => {
      const token = localStorage.getItem('token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    });

    // Response interceptor: handle 401
    this.client.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401) {
          localStorage.removeItem('token');
          window.location.href = '/login';
        }
        return Promise.reject(error);
      }
    );
  }

  // Authentication
  async login(email: string, password: string) {
    const { data } = await this.client.post('/auth/login', { email, password });
    return data;
  }

  // Calendar OAuth
  async startMicrosoftOAuth() {
    const { data } = await this.client.post('/calendar/oauth/microsoft/start');
    return data;
  }

  async pollMicrosoftOAuth(deviceCode: string) {
    const { data } = await this.client.post('/calendar/oauth/microsoft/poll', {
      device_code: deviceCode
    });
    return data;
  }

  async getConnectedCalendars() {
    const { data } = await this.client.get('/calendar/oauth/connected');
    return data;
  }

  async setPrimaryCalendar(provider: string) {
    const { data } = await this.client.post(`/calendar/oauth/${provider}/primary`);
    return data;
  }

  // ... other methods
}

export const api = new ApiClient();
```

### 3.2 Environment Configuration

**File:** `.env`

```bash
# API Base URL - NO hardcoded IPs in code!
VITE_API_URL=http://172.31.3.193:8003/api/v1
```

**Usage in code:**
```typescript
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8003/api/v1';
```

**Benefits:**
- Single place to change backend URL
- Different URLs for dev/staging/production
- No IP addresses scattered in codebase

### 3.3 API Endpoints Reference

**Backend API:** `http://172.31.3.193:8003/api/v1`

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
POST   /calendar/oauth/{provider}/primary    # TODO: Implement in backend
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

## 4. Testing & Development Guidelines

### 4.1 Development Workflow

**When adding new API features:**

1. **Backend First:** Implement endpoint in FastAPI server
   ```python
   @router.post("/calendar/oauth/microsoft/start")
   async def start_microsoft_oauth(user_id: str = Depends(get_current_user)):
       # Call MCP service
       result = await mcp_microsoft_client.start_oauth()
       return result
   ```

2. **API Client:** Add method to `src/services/api/client.ts`
   ```typescript
   async startMicrosoftOAuth() {
     const { data } = await this.client.post('/calendar/oauth/microsoft/start');
     return data;
   }
   ```

3. **UI Integration:** Use API client in pages/components
   ```typescript
   import { api } from '../../services/api/client';

   const handleOAuth = async () => {
     const response = await api.startMicrosoftOAuth();
     // Handle response
   };
   ```

### 4.2 Temporary Testing Exceptions

**Allowed during development:**
```typescript
// TEMPORARY: Direct MCP call for testing
// TODO: Issue #123 - Implement /calendar/oauth/microsoft/start endpoint
const response = await fetch('http://172.31.3.193:9001/auth/start', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
});
```

**Requirements:**
- Must have `TEMPORARY` comment
- Must reference GitHub issue
- Must be replaced before PR merge

### 4.3 Code Review Checklist

Before merging any PR, verify:

- [ ] No hardcoded IP addresses or URLs (except in `.env`)
- [ ] All external calls go through `src/services/api/client.ts`
- [ ] No direct `fetch()` calls to MCP services
- [ ] All API methods have proper TypeScript typing
- [ ] Error handling implemented
- [ ] No `TEMPORARY` comments in code

### 4.4 Testing API Layer

**Unit Test Example:**
```typescript
import { api } from './client';
import axios from 'axios';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('API Client', () => {
  it('should call correct endpoint for Microsoft OAuth', async () => {
    mockedAxios.post.mockResolvedValue({
      data: { user_code: 'ABC123', verification_uri: 'https://microsoft.com/device' }
    });

    const result = await api.startMicrosoftOAuth();

    expect(mockedAxios.post).toHaveBeenCalledWith('/calendar/oauth/microsoft/start');
    expect(result.user_code).toBe('ABC123');
  });
});
```

---

## 5. Networking & Browser Compatibility

### 5.1 Mixed Content Policy

**Issue:** Browsers block HTTP requests from HTTPS pages (mixed content).

**Solution:** Ensure consistent protocol:
- Development: All HTTP (`http://localhost:5174` → `http://172.31.3.193:8003`)
- Production: All HTTPS (`https://app.claudine.com` → `https://api.claudine.com`)

### 5.2 CORS Configuration

**Backend responsibility:** API server must send proper CORS headers:
```python
# FastAPI backend
from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5174", "https://app.claudine.com"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

**Client:** No CORS configuration needed - axios automatically handles credentials.

### 5.3 Chrome Private Network Access

**Issue:** Chrome blocks requests to private IPs (192.168.x.x, 100.x.x.x) from browsers.

**Solutions:**
1. Use Windows Tailscale IP instead of WSL IP (remote IPs allowed)
2. Setup port forwarding: Windows → WSL
3. Use localhost with port forwarding on same machine

**Current setup:**
- Vite dev server: `http://100.104.213.54:5174` (Windows Tailscale IP)
- API server: `http://172.31.3.193:8003` (WSL bridge IP - accessible from Windows)

---

## Document History

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | 2024-12-01 | Initial document |
| 2.0 | 2024-12-08 | Added API layer principles, no direct MCP calls policy |

---

**Last Updated:** 2024-12-08
**Next Review:** 2024-12-22
