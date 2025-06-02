// Service Worker for Push Notifications
const CACHE_NAME = 'milkman-v1';
const urlsToCache = [
  '/',
  '/dashboard',
  '/offline.html'
];

// Install event - cache resources
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(urlsToCache))
  );
});

// Fetch event - serve from cache when offline
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // Return cached version or fetch from network
        return response || fetch(event.request);
      }
    )
  );
});

// Push event - handle incoming push notifications
self.addEventListener('push', (event) => {
  if (!event.data) {
    return;
  }

  const options = {
    icon: '/icons/icon-192x192.png',
    badge: '/icons/badge-72x72.png',
    image: '/icons/notification-image.png',
    vibrate: [200, 100, 200],
    requireInteraction: false,
    silent: false,
    timestamp: Date.now(),
    actions: [
      {
        action: 'view',
        title: 'View',
        icon: '/icons/view-icon.png'
      },
      {
        action: 'close',
        title: 'Close',
        icon: '/icons/close-icon.png'
      }
    ]
  };

  try {
    const data = event.data.json();
    
    // Merge default options with notification data
    const notificationOptions = {
      ...options,
      body: data.message || data.body,
      data: data.data || {},
      tag: data.tag || 'general',
      renotify: data.renotify || false,
      ...data.options
    };

    // Show the notification
    event.waitUntil(
      self.registration.showNotification(
        data.title || 'MilkMan Notification',
        notificationOptions
      )
    );
  } catch (error) {
    console.error('Error parsing push notification data:', error);
    
    // Fallback notification
    event.waitUntil(
      self.registration.showNotification('MilkMan Notification', {
        ...options,
        body: 'You have a new notification'
      })
    );
  }
});

// Notification click event
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const action = event.action;
  const data = event.notification.data || {};
  
  if (action === 'close') {
    return;
  }

  // Handle notification click
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then((clientList) => {
        // Try to focus existing window
        for (const client of clientList) {
          if (client.url.includes(self.location.origin) && 'focus' in client) {
            if (data.url) {
              client.navigate(data.url);
            }
            return client.focus();
          }
        }
        
        // Open new window if no existing window found
        const urlToOpen = data.url || `${self.location.origin}/dashboard`;
        return clients.openWindow(urlToOpen);
      })
  );
});

// Background sync for failed notifications
self.addEventListener('sync', (event) => {
  if (event.tag === 'notification-sync') {
    event.waitUntil(
      // Retry failed notification operations
      syncNotifications()
    );
  }
});

async function syncNotifications() {
  try {
    // Get failed notification operations from IndexedDB
    const failedOperations = await getFailedOperations();
    
    for (const operation of failedOperations) {
      try {
        await retryOperation(operation);
        await removeFailedOperation(operation.id);
      } catch (error) {
        console.error('Failed to retry notification operation:', error);
      }
    }
  } catch (error) {
    console.error('Failed to sync notifications:', error);
  }
}

// Helper functions for IndexedDB operations
async function getFailedOperations() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('milkman-notifications', 1);
    
    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      const db = request.result;
      const transaction = db.transaction(['failed-operations'], 'readonly');
      const store = transaction.objectStore('failed-operations');
      const getAllRequest = store.getAll();
      
      getAllRequest.onsuccess = () => resolve(getAllRequest.result);
      getAllRequest.onerror = () => reject(getAllRequest.error);
    };
    
    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains('failed-operations')) {
        db.createObjectStore('failed-operations', { keyPath: 'id' });
      }
    };
  });
}

async function removeFailedOperation(id) {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('milkman-notifications', 1);
    
    request.onsuccess = () => {
      const db = request.result;
      const transaction = db.transaction(['failed-operations'], 'readwrite');
      const store = transaction.objectStore('failed-operations');
      const deleteRequest = store.delete(id);
      
      deleteRequest.onsuccess = () => resolve();
      deleteRequest.onerror = () => reject(deleteRequest.error);
    };
  });
}

async function retryOperation(operation) {
  const { type, data } = operation;
  
  switch (type) {
    case 'markAsRead':
      return fetch(`/api/notifications/${data.notificationId}/read`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${data.token}`,
          'Content-Type': 'application/json'
        }
      });
    
    case 'deleteNotification':
      return fetch(`/api/notifications/${data.notificationId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${data.token}`
        }
      });
    
    default:
      throw new Error(`Unknown operation type: ${type}`);
  }
}

// Message event for communication with main thread
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
