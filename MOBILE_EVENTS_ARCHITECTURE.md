# Mobile Events & Notifications Architecture
## Claudine Mobile - iOS & Android

**Versie:** 1.0
**Datum:** 2025-11-15
**Platform:** React + TypeScript + Capacitor

---

## 📱 Overview

Deze architectuur beschrijft hoe Claudine Mobile omgaat met:
- System events (app lifecycle, network, battery, etc.)
- Push notifications (remote via server)
- Local notifications (timers, reminders, taken)
- Background processing
- Deep linking
- Permissions management

---

## 🏗️ Architectuur Layers

```
┌─────────────────────────────────────────────────────────┐
│                    React Components                      │
│  (Chat, Tasks, Notes, Calendar - UI Layer)              │
└────────────────┬────────────────────────────────────────┘
                 │
┌────────────────▼────────────────────────────────────────┐
│              Event Store (Zustand)                       │
│  - EventBus, NotificationStore, SystemStore             │
└────────────────┬────────────────────────────────────────┘
                 │
┌────────────────▼────────────────────────────────────────┐
│           Event Services Layer                           │
│  - NotificationService                                   │
│  - SystemEventService                                    │
│  - BackgroundTaskService                                 │
│  - DeepLinkService                                       │
└────────────────┬────────────────────────────────────────┘
                 │
┌────────────────▼────────────────────────────────────────┐
│          Capacitor Plugins Layer                         │
│  - @capacitor/push-notifications                         │
│  - @capacitor/local-notifications                        │
│  - @capacitor/app                                        │
│  - @capacitor/network                                    │
│  - @capacitor/background-task                            │
│  - @capacitor/haptics                                    │
│  - @capacitor/badge                                      │
└────────────────┬────────────────────────────────────────┘
                 │
┌────────────────▼────────────────────────────────────────┐
│              Native Platform                             │
│         iOS (APNs) / Android (FCM)                       │
└─────────────────────────────────────────────────────────┘
```

---

## 📦 Required Capacitor Plugins

### Core Plugins
```bash
npm install @capacitor/push-notifications
npm install @capacitor/local-notifications
npm install @capacitor/app
npm install @capacitor/network
npm install @capacitor/haptics
npm install @capacitor/badge
npm install @capacitor/action-sheet
npm install @capacitor/app-launcher
```

### Community Plugins
```bash
npm install @capacitor-community/background-geolocation
npm install @capacitor-community/fcm  # Voor Android push
```

---

## 🎯 1. System Events Detection

### App Lifecycle Events

**Detecteerbare events:**
- App start (cold boot)
- App foreground (resume)
- App background (pause)
- App termination
- Deep link open
- URL scheme handling

**Implementation:**

```typescript
// src/services/system/SystemEventService.ts

import { App, AppState, URLOpenListenerEvent } from '@capacitor/app';
import { Network, ConnectionStatus } from '@capacitor/network';
import { Capacitor } from '@capacitor/core';

export class SystemEventService {
  private static instance: SystemEventService;
  private listeners: Map<string, Set<(data: any) => void>> = new Map();

  private constructor() {
    this.initializeListeners();
  }

  static getInstance(): SystemEventService {
    if (!SystemEventService.instance) {
      SystemEventService.instance = new SystemEventService();
    }
    return SystemEventService.instance;
  }

  private async initializeListeners() {
    if (!Capacitor.isNativePlatform()) {
      console.log('Running in web mode - native events disabled');
      return;
    }

    // 1. APP LIFECYCLE EVENTS
    App.addListener('appStateChange', (state: AppState) => {
      this.emit('app:state', state);

      if (state.isActive) {
        this.emit('app:foreground', state);
        this.onAppForeground();
      } else {
        this.emit('app:background', state);
        this.onAppBackground();
      }
    });

    // 2. APP URL OPEN (Deep Links)
    App.addListener('appUrlOpen', (event: URLOpenListenerEvent) => {
      this.emit('app:url-open', event);
      this.handleDeepLink(event.url);
    });

    // 3. BACK BUTTON (Android)
    App.addListener('backButton', ({ canGoBack }) => {
      this.emit('app:back-button', { canGoBack });
    });

    // 4. NETWORK STATUS
    Network.addListener('networkStatusChange', (status: ConnectionStatus) => {
      this.emit('network:change', status);

      if (status.connected) {
        this.emit('network:online', status);
      } else {
        this.emit('network:offline', status);
      }
    });

    // Get initial network status
    const status = await Network.getStatus();
    this.emit('network:status', status);
  }

  // Event Bus Pattern
  on(event: string, callback: (data: any) => void) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(callback);

    // Return unsubscribe function
    return () => {
      this.listeners.get(event)?.delete(callback);
    };
  }

  private emit(event: string, data: any) {
    const callbacks = this.listeners.get(event);
    if (callbacks) {
      callbacks.forEach(callback => callback(data));
    }
  }

  // Lifecycle Handlers
  private async onAppForeground() {
    console.log('📱 App entered foreground');

    // Sync data from server
    // Clear badge count
    // Refresh UI state
    // Resume background tasks
  }

  private async onAppBackground() {
    console.log('📱 App entered background');

    // Save state
    // Pause heavy operations
    // Schedule background sync
  }

  private handleDeepLink(url: string) {
    console.log('🔗 Deep link opened:', url);

    // Parse URL: claudine://chat/conversation/123
    // Navigate to appropriate screen
    // Handle custom actions
  }

  async cleanup() {
    await App.removeAllListeners();
    await Network.removeAllListeners();
    this.listeners.clear();
  }
}

export const systemEventService = SystemEventService.getInstance();
```

---

## 🔔 2. Push Notifications Architecture

### A. Remote Push Notifications (Server → Device)

**Flow:**
```
Server (FastAPI) → APNs/FCM → Device → App → NotificationService → UI
```

**Implementation:**

```typescript
// src/services/notifications/PushNotificationService.ts

import {
  PushNotifications,
  PushNotificationSchema,
  ActionPerformed,
  Token
} from '@capacitor/push-notifications';
import { Capacitor } from '@capacitor/core';

export class PushNotificationService {
  private static instance: PushNotificationService;
  private deviceToken: string | null = null;

  private constructor() {}

  static getInstance(): PushNotificationService {
    if (!PushNotificationService.instance) {
      PushNotificationService.instance = new PushNotificationService();
    }
    return PushNotificationService.instance;
  }

  async initialize() {
    if (!Capacitor.isNativePlatform()) {
      console.log('Push notifications only available on native platforms');
      return;
    }

    // 1. REQUEST PERMISSION
    const permStatus = await PushNotifications.requestPermissions();

    if (permStatus.receive === 'granted') {
      // 2. REGISTER FOR PUSH
      await PushNotifications.register();
    } else {
      console.warn('Push notification permission denied');
      return;
    }

    // 3. LISTEN FOR REGISTRATION
    PushNotifications.addListener('registration', async (token: Token) => {
      console.log('📱 Push registration success, token:', token.value);
      this.deviceToken = token.value;

      // Send token to backend
      await this.sendTokenToServer(token.value);
    });

    // 4. REGISTRATION ERROR
    PushNotifications.addListener('registrationError', (error: any) => {
      console.error('📱 Push registration error:', error);
    });

    // 5. NOTIFICATION RECEIVED (App in foreground)
    PushNotifications.addListener(
      'pushNotificationReceived',
      (notification: PushNotificationSchema) => {
        console.log('📬 Push received (foreground):', notification);
        this.handleForegroundNotification(notification);
      }
    );

    // 6. NOTIFICATION TAPPED (App in background/killed)
    PushNotifications.addListener(
      'pushNotificationActionPerformed',
      (action: ActionPerformed) => {
        console.log('👆 Push action performed:', action);
        this.handleNotificationTap(action);
      }
    );
  }

  private async sendTokenToServer(token: string) {
    try {
      const apiUrl = import.meta.env.VITE_API_URL;
      const authToken = localStorage.getItem('token');

      await fetch(`${apiUrl}/notifications/register-device`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          device_token: token,
          platform: Capacitor.getPlatform(), // 'ios' | 'android'
          device_info: {
            model: await this.getDeviceModel(),
            os_version: await this.getOSVersion(),
          }
        }),
      });

      console.log('✅ Device token registered with server');
    } catch (error) {
      console.error('❌ Failed to register device token:', error);
    }
  }

  private handleForegroundNotification(notification: PushNotificationSchema) {
    // Show in-app banner/toast
    // Play sound/haptic
    // Update badge

    const { title, body, data } = notification;

    // Dispatch to store
    notificationStore.getState().addNotification({
      id: Date.now().toString(),
      title: title || 'Claudine',
      body: body || '',
      data: data,
      timestamp: new Date().toISOString(),
      read: false,
    });
  }

  private handleNotificationTap(action: ActionPerformed) {
    const { notification, actionId } = action;

    // Navigate based on notification data
    if (notification.data?.conversation_id) {
      // Navigate to conversation
      window.location.href = `/chat/${notification.data.conversation_id}`;
    } else if (notification.data?.task_id) {
      // Navigate to task
      window.location.href = `/tasks?highlight=${notification.data.task_id}`;
    } else if (notification.data?.note_id) {
      // Navigate to note
      window.location.href = `/notes?highlight=${notification.data.note_id}`;
    }

    // Mark as read
    notificationStore.getState().markAsRead(notification.id);
  }

  async getDeviceModel(): Promise<string> {
    // Use @capacitor/device plugin
    return 'Unknown';
  }

  async getOSVersion(): Promise<string> {
    // Use @capacitor/device plugin
    return 'Unknown';
  }

  async cleanup() {
    await PushNotifications.removeAllListeners();
  }
}

export const pushNotificationService = PushNotificationService.getInstance();
```

---

### B. Local Notifications (App-Generated)

**Use Cases:**
- Reminder notifications
- Task deadlines
- Calendar events
- Background sync completion

```typescript
// src/services/notifications/LocalNotificationService.ts

import {
  LocalNotifications,
  LocalNotificationSchema,
  ActionPerformed,
  ScheduleOptions
} from '@capacitor/local-notifications';
import { Capacitor } from '@capacitor/core';

export class LocalNotificationService {
  private static instance: LocalNotificationService;

  private constructor() {}

  static getInstance(): LocalNotificationService {
    if (!LocalNotificationService.instance) {
      LocalNotificationService.instance = new LocalNotificationService();
    }
    return LocalNotificationService.instance;
  }

  async initialize() {
    if (!Capacitor.isNativePlatform()) {
      return;
    }

    // Request permissions
    const permStatus = await LocalNotifications.requestPermissions();

    if (permStatus.display !== 'granted') {
      console.warn('Local notification permission denied');
      return;
    }

    // Listen for notification tap
    LocalNotifications.addListener(
      'localNotificationActionPerformed',
      (action: ActionPerformed) => {
        console.log('Local notification tapped:', action);
        this.handleLocalNotificationTap(action);
      }
    );
  }

  async scheduleReminder(options: {
    id: number;
    title: string;
    body: string;
    scheduleAt: Date;
    data?: any;
  }) {
    const notifications: LocalNotificationSchema[] = [{
      id: options.id,
      title: options.title,
      body: options.body,
      schedule: {
        at: options.scheduleAt,
      },
      sound: 'default',
      attachments: undefined,
      actionTypeId: '',
      extra: options.data || {},
    }];

    await LocalNotifications.schedule({ notifications });
    console.log(`📅 Scheduled local notification #${options.id}`);
  }

  async scheduleTaskReminder(task: {
    id: string;
    title: string;
    due_date: string;
  }) {
    const dueDate = new Date(task.due_date);
    const reminderTime = new Date(dueDate.getTime() - 1 * 60 * 60 * 1000); // 1 hour before

    await this.scheduleReminder({
      id: parseInt(task.id.replace(/\D/g, '')) || Date.now(),
      title: '📋 Taak herinnering',
      body: `"${task.title}" moet over 1 uur klaar zijn`,
      scheduleAt: reminderTime,
      data: {
        type: 'task_reminder',
        task_id: task.id,
      },
    });
  }

  async cancelNotification(id: number) {
    await LocalNotifications.cancel({ notifications: [{ id }] });
  }

  async cancelAll() {
    await LocalNotifications.cancel({ notifications: [] });
  }

  async getPending() {
    const { notifications } = await LocalNotifications.getPending();
    return notifications;
  }

  private handleLocalNotificationTap(action: ActionPerformed) {
    const { notification } = action;

    if (notification.extra?.type === 'task_reminder') {
      window.location.href = `/tasks?highlight=${notification.extra.task_id}`;
    } else if (notification.extra?.type === 'calendar_event') {
      window.location.href = `/calendar?event=${notification.extra.event_id}`;
    }
  }

  async cleanup() {
    await LocalNotifications.removeAllListeners();
  }
}

export const localNotificationService = LocalNotificationService.getInstance();
```

---

## 🗄️ 3. State Management - Notification Store

```typescript
// src/stores/notificationStore.ts

import { create } from 'zustand';

export interface Notification {
  id: string;
  title: string;
  body: string;
  data?: any;
  timestamp: string;
  read: boolean;
  type: 'push' | 'local' | 'system';
}

interface NotificationState {
  notifications: Notification[];
  unreadCount: number;

  // Actions
  addNotification: (notification: Notification) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  deleteNotification: (id: string) => void;
  clearAll: () => void;
}

export const useNotificationStore = create<NotificationState>((set) => ({
  notifications: [],
  unreadCount: 0,

  addNotification: (notification) => {
    set((state) => {
      const newNotifications = [notification, ...state.notifications];
      const unreadCount = newNotifications.filter(n => !n.read).length;

      return {
        notifications: newNotifications,
        unreadCount,
      };
    });
  },

  markAsRead: (id) => {
    set((state) => {
      const notifications = state.notifications.map(n =>
        n.id === id ? { ...n, read: true } : n
      );
      const unreadCount = notifications.filter(n => !n.read).length;

      return { notifications, unreadCount };
    });
  },

  markAllAsRead: () => {
    set((state) => ({
      notifications: state.notifications.map(n => ({ ...n, read: true })),
      unreadCount: 0,
    }));
  },

  deleteNotification: (id) => {
    set((state) => {
      const notifications = state.notifications.filter(n => n.id !== id);
      const unreadCount = notifications.filter(n => !n.read).length;

      return { notifications, unreadCount };
    });
  },

  clearAll: () => {
    set({ notifications: [], unreadCount: 0 });
  },
}));
```

---

## 🎨 4. UI Components - Notification Center

```typescript
// src/components/NotificationCenter.tsx

import { FC, useEffect } from 'react';
import { useNotificationStore } from '../stores/notificationStore';
import { Badge } from '@capacitor/badge';

export const NotificationCenter: FC = () => {
  const { notifications, unreadCount, markAsRead, deleteNotification } =
    useNotificationStore();

  // Update app badge (iOS/Android)
  useEffect(() => {
    Badge.set({ count: unreadCount }).catch(console.error);
  }, [unreadCount]);

  return (
    <div className="notification-center">
      <div className="header">
        <h2>Meldingen ({unreadCount})</h2>
      </div>

      <div className="notifications-list">
        {notifications.length === 0 ? (
          <p className="empty">Geen meldingen</p>
        ) : (
          notifications.map((notification) => (
            <div
              key={notification.id}
              className={`notification-item ${notification.read ? 'read' : 'unread'}`}
              onClick={() => markAsRead(notification.id)}
            >
              <div className="content">
                <h4>{notification.title}</h4>
                <p>{notification.body}</p>
                <span className="time">
                  {new Date(notification.timestamp).toLocaleString('nl-NL')}
                </span>
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  deleteNotification(notification.id);
                }}
                className="delete-btn"
              >
                ×
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
```

---

## 🚀 5. Initialization - App.tsx Integration

```typescript
// src/App.tsx

import { useEffect } from 'react';
import { systemEventService } from './services/system/SystemEventService';
import { pushNotificationService } from './services/notifications/PushNotificationService';
import { localNotificationService } from './services/notifications/LocalNotificationService';
import { useNotificationStore } from './stores/notificationStore';
import { useChatStore } from './stores/chatStore';

const App: FC = () => {
  const { isAuthenticated, initAuth } = useAuthStore();

  useEffect(() => {
    initAuth();
    initializeMobileServices();

    return () => {
      cleanupMobileServices();
    };
  }, []);

  const initializeMobileServices = async () => {
    // 1. Initialize system event listeners
    systemEventService.on('app:foreground', () => {
      console.log('App resumed - syncing data...');
      // Refresh conversations, tasks, notes
    });

    systemEventService.on('network:offline', () => {
      console.log('Network lost - enabling offline mode');
      // Show offline banner
    });

    systemEventService.on('network:online', () => {
      console.log('Network restored - syncing...');
      // Hide offline banner, sync pending changes
    });

    // 2. Initialize push notifications
    if (isAuthenticated) {
      await pushNotificationService.initialize();
    }

    // 3. Initialize local notifications
    await localNotificationService.initialize();
  };

  const cleanupMobileServices = async () => {
    await systemEventService.cleanup();
    await pushNotificationService.cleanup();
    await localNotificationService.cleanup();
  };

  return (
    // ... rest of app
  );
};
```

---

## 📋 6. Backend Integration (FastAPI)

### Push Notification Endpoints

```python
# Server: app/routers/notifications.py

from fastapi import APIRouter, Depends
from app.services.push_service import PushService

router = APIRouter(prefix="/notifications", tags=["notifications"])

@router.post("/register-device")
async def register_device(
    device_token: str,
    platform: str,  # 'ios' | 'android'
    user = Depends(get_current_user)
):
    """Register device token for push notifications"""
    await PushService.register_device(
        user_id=user.id,
        device_token=device_token,
        platform=platform
    )
    return {"success": True}

@router.post("/send")
async def send_push_notification(
    user_id: str,
    title: str,
    body: str,
    data: dict = None
):
    """Send push notification to user's devices"""
    await PushService.send_notification(
        user_id=user_id,
        title=title,
        body=body,
        data=data or {}
    )
    return {"success": True}
```

### Push Service (APNs + FCM)

```python
# Server: app/services/push_service.py

import httpx
from typing import Optional

class PushService:
    @staticmethod
    async def send_notification(
        user_id: str,
        title: str,
        body: str,
        data: dict
    ):
        # Get user's registered devices
        devices = await db.get_user_devices(user_id)

        for device in devices:
            if device.platform == 'ios':
                await PushService._send_apns(device.token, title, body, data)
            elif device.platform == 'android':
                await PushService._send_fcm(device.token, title, body, data)

    @staticmethod
    async def _send_apns(token: str, title: str, body: str, data: dict):
        """Send via Apple Push Notification Service"""
        # Implementation using aioapns or httpx
        pass

    @staticmethod
    async def _send_fcm(token: str, title: str, body: str, data: dict):
        """Send via Firebase Cloud Messaging"""
        # Implementation using firebase-admin or httpx
        pass
```

---

## 🔐 7. Permissions Management

```typescript
// src/services/permissions/PermissionService.ts

import { Capacitor } from '@capacitor/core';
import { PushNotifications } from '@capacitor/push-notifications';
import { LocalNotifications } from '@capacitor/local-notifications';
import { Camera } from '@capacitor/camera';
import { Geolocation } from '@capacitor/geolocation';

export class PermissionService {
  async checkAllPermissions() {
    const permissions = {
      push: await this.checkPushPermission(),
      localNotifications: await this.checkLocalNotificationPermission(),
      camera: await this.checkCameraPermission(),
      location: await this.checkLocationPermission(),
    };

    return permissions;
  }

  async checkPushPermission() {
    if (!Capacitor.isNativePlatform()) return 'granted';

    const result = await PushNotifications.checkPermissions();
    return result.receive;
  }

  async requestPushPermission() {
    const result = await PushNotifications.requestPermissions();
    return result.receive === 'granted';
  }

  async checkLocalNotificationPermission() {
    if (!Capacitor.isNativePlatform()) return 'granted';

    const result = await LocalNotifications.checkPermissions();
    return result.display;
  }

  async requestLocalNotificationPermission() {
    const result = await LocalNotifications.requestPermissions();
    return result.display === 'granted';
  }

  // ... other permission checks
}

export const permissionService = new PermissionService();
```

---

## 📊 8. Event Types & Payloads

### System Events

```typescript
// src/types/events.ts

export type SystemEventType =
  | 'app:state'
  | 'app:foreground'
  | 'app:background'
  | 'app:url-open'
  | 'app:back-button'
  | 'network:change'
  | 'network:online'
  | 'network:offline';

export interface SystemEvent {
  type: SystemEventType;
  timestamp: string;
  data: any;
}
```

### Notification Payloads

```typescript
export interface PushNotificationPayload {
  title: string;
  body: string;
  data: {
    type: 'chat' | 'task' | 'note' | 'calendar' | 'system';
    conversation_id?: string;
    task_id?: string;
    note_id?: string;
    event_id?: string;
    action?: string;
  };
}
```

---

## 🎯 9. Use Case Examples

### Example 1: New Chat Message Notification

```typescript
// Server sends push when new message arrives
await PushService.send_notification(
  user_id="user-123",
  title="Nieuwe bericht van Claudine",
  body="Je vraag is beantwoord!",
  data={
    "type": "chat",
    "conversation_id": "conv-456"
  }
)

// Client handles it:
// 1. If app is foreground: Show in-app banner
// 2. If app is background: OS shows notification
// 3. User taps: Navigate to /chat/conv-456
```

### Example 2: Task Deadline Reminder

```typescript
// When creating a task with due_date
const task = await api.createTask({
  title: "Finish report",
  due_date: "2025-11-16T15:00:00Z"
});

// Schedule local notification 1 hour before
await localNotificationService.scheduleTaskReminder(task);
```

### Example 3: Network Offline Handling

```typescript
systemEventService.on('network:offline', () => {
  // Show banner
  showOfflineBanner();

  // Queue messages locally
  chatStore.setOfflineMode(true);
});

systemEventService.on('network:online', () => {
  // Hide banner
  hideOfflineBanner();

  // Sync queued messages
  chatStore.syncOfflineMessages();
});
```

---

## 📁 Folder Structure

```
src/
├── services/
│   ├── system/
│   │   └── SystemEventService.ts
│   ├── notifications/
│   │   ├── PushNotificationService.ts
│   │   ├── LocalNotificationService.ts
│   │   └── NotificationHandler.ts
│   ├── permissions/
│   │   └── PermissionService.ts
│   └── deeplink/
│       └── DeepLinkService.ts
├── stores/
│   ├── notificationStore.ts
│   └── systemStore.ts
├── components/
│   ├── NotificationCenter.tsx
│   ├── NotificationBanner.tsx
│   └── PermissionRequest.tsx
├── hooks/
│   ├── useSystemEvents.ts
│   └── useNotifications.ts
└── types/
    └── events.ts
```

---

## ✅ Implementation Checklist

### Phase 1: Core Infrastructure
- [ ] Install Capacitor plugins
- [ ] Create SystemEventService
- [ ] Create NotificationStore
- [ ] Test app lifecycle events

### Phase 2: Push Notifications
- [ ] Setup APNs certificates (iOS)
- [ ] Setup FCM project (Android)
- [ ] Implement PushNotificationService
- [ ] Backend: Device registration endpoint
- [ ] Backend: Send notification endpoint
- [ ] Test end-to-end push flow

### Phase 3: Local Notifications
- [ ] Implement LocalNotificationService
- [ ] Task deadline reminders
- [ ] Calendar event reminders
- [ ] Test notification scheduling

### Phase 4: UI Integration
- [ ] NotificationCenter component
- [ ] In-app notification banners
- [ ] Permission request flows
- [ ] Badge count management

### Phase 5: Deep Linking
- [ ] Configure URL schemes
- [ ] Implement DeepLinkService
- [ ] Handle navigation from notifications
- [ ] Test deep link flows

---

## 🔒 Security Considerations

1. **Token Security**
   - Store device tokens encrypted
   - Validate tokens server-side
   - Implement token rotation

2. **Notification Content**
   - Don't send sensitive data in push payload
   - Fetch actual content from API after notification tap
   - Use notification IDs as references

3. **Permissions**
   - Request permissions contextually (not on app start)
   - Explain why permissions are needed
   - Handle denied permissions gracefully

---

## 🧪 Testing Strategy

### Unit Tests
- Event emission and subscription
- Notification payload parsing
- Permission checking

### Integration Tests
- End-to-end push notification flow
- Deep link navigation
- Offline mode handling

### Manual Testing
- Test on real iOS device (APNs requires physical device)
- Test on Android device/emulator
- Test notification tap actions
- Test permission flows
- Test background behavior

---

## 📚 Resources

- [Capacitor Push Notifications](https://capacitorjs.com/docs/apis/push-notifications)
- [Capacitor Local Notifications](https://capacitorjs.com/docs/apis/local-notifications)
- [Capacitor App API](https://capacitorjs.com/docs/apis/app)
- [APNs Documentation](https://developer.apple.com/documentation/usernotifications)
- [FCM Documentation](https://firebase.google.com/docs/cloud-messaging)

---

**Einde Architectuur Document**
