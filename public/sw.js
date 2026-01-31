/**
 * Service Worker for AFENDA PWA
 * Handles offline caching, background sync, and push notifications
 */

const CACHE_PREFIX = "afenda-v1"
const STATIC_CACHE = `${CACHE_PREFIX}-static`
const API_CACHE = `${CACHE_PREFIX}-api`
const DYNAMIC_CACHE = `${CACHE_PREFIX}-dynamic`

// Files to cache on install
const STATIC_ASSETS = [
  "/",
  "/offline",
  "/manifest.json",
  "/_next/static/css/app/layout.css",
  "/_next/static/css/app/page.css",
  "/icons/icon-192x192.png",
  "/icons/icon-512x512.png",
]

// API endpoints to cache
const CACHEABLE_API_PATTERNS = [
  /^\/api\/v1\/tasks/,
  /^\/api\/v1\/projects/,
  /^\/api\/v1\/sync\/pull/,
]

// Install event - cache static assets
self.addEventListener("install", (event) => {
  console.log("Service Worker: Installing...")

  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then((cache) => {
        console.log("Service Worker: Caching static assets")
        return cache.addAll(STATIC_ASSETS)
      })
      .then(() => self.skipWaiting())
  )
})

// Activate event - clean up old caches
self.addEventListener("activate", (event) => {
  console.log("Service Worker: Activating...")

  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName.startsWith("afenda-") && !cacheName.startsWith(CACHE_PREFIX)) {
              console.log("Service Worker: Deleting old cache", cacheName)
              return caches.delete(cacheName)
            }
          })
        )
      })
      .then(() => self.clients.claim())
  )
})

// Fetch event - handle requests
self.addEventListener("fetch", (event) => {
  const { request } = event
  const url = new URL(request.url)

  // Handle different request types
  if (request.method === "GET") {
    // Handle navigation requests
    if (request.mode === "navigate") {
      event.respondWith(handleNavigationRequest(request))
      return
    }

    // Handle API requests
    if (url.pathname.startsWith("/api/")) {
      event.respondWith(handleApiRequest(request))
      return
    }

    // Handle static assets
    if (STATIC_ASSETS.some(asset => url.pathname === asset) ||
      url.pathname.startsWith("/_next/static/") ||
      url.pathname.startsWith("/icons/")) {
      event.respondWith(handleStaticRequest(request))
      return
    }
  }

  // Handle POST requests for sync
  if (request.method === "POST" && url.pathname.startsWith("/api/v1/sync/")) {
    event.respondWith(handleSyncRequest(request))
    return
  }
})

/**
 * Handle navigation requests - serve app or offline page
 */
async function handleNavigationRequest(request) {
  try {
    // Try network first for navigation
    const response = await fetch(request)

    // Cache the response
    const cache = await caches.open(DYNAMIC_CACHE)
    cache.put(request, response.clone())

    return response
  } catch (error) {
    // Network failed, try cache
    const cachedResponse = await caches.match(request)
    if (cachedResponse) {
      return cachedResponse
    }

    // Return offline page
    const offlineResponse = await caches.match("/offline")
    if (offlineResponse) {
      return offlineResponse
    }

    // Fallback
    return new Response("Offline", {
      status: 503,
      statusText: "Service Unavailable",
    })
  }
}

/**
 * Handle static asset requests
 */
async function handleStaticRequest(request) {
  const cachedResponse = await caches.match(request)
  if (cachedResponse) {
    return cachedResponse
  }

  try {
    const response = await fetch(request)

    // Cache successful responses
    if (response.ok) {
      const cache = await caches.open(STATIC_CACHE)
      cache.put(request, response.clone())
    }

    return response
  } catch (error) {
    // Return cached version if available
    const cachedResponse = await caches.match(request)
    if (cachedResponse) {
      return cachedResponse
    }

    throw error
  }
}

/**
 * Handle API requests with caching strategy
 */
async function handleApiRequest(request) {
  const url = new URL(request.url)

  // Check if this is a cacheable API request
  const isCacheable = CACHEABLE_API_PATTERNS.some(pattern => pattern.test(url.pathname))

  if (!isCacheable) {
    // Non-cacheable API, go to network
    return fetch(request)
  }

  // Check cache first
  const cachedResponse = await caches.match(request)
  if (cachedResponse) {
    // Check if cache is still fresh (5 minutes)
    const cacheDate = cachedResponse.headers.get("sw-cache-date")
    if (cacheDate) {
      const cacheAge = Date.now() - parseInt(cacheDate)
      if (cacheAge < 5 * 60 * 1000) { // 5 minutes
        return cachedResponse
      }
    }
  }

  try {
    const response = await fetch(request)

    // Cache successful GET responses
    if (response.ok && isCacheable) {
      const cache = await caches.open(API_CACHE)
      const responseToCache = response.clone()

      // Add cache date header
      const headers = new Headers(responseToCache.headers)
      headers.set("sw-cache-date", Date.now().toString())

      const cachedResponse = new Response(responseToCache.body, {
        status: responseToCache.status,
        statusText: responseToCache.statusText,
        headers,
      })

      cache.put(request, cachedResponse)
    }

    return response
  } catch (error) {
    // Network failed, return cached version if available
    if (cachedResponse) {
      return cachedResponse
    }

    throw error
  }
}

/**
 * Handle sync requests with background sync
 */
async function handleSyncRequest(request) {
  try {
    // Try to send the request
    const response = await fetch(request)
    return response
  } catch {
    // Network failed, store for background sync
    if ("serviceWorker" in navigator && "sync" in window.ServiceWorkerRegistration.prototype) {
      // Store the request for later
      const clone = request.clone()
      const body = await clone.text()

      // Store in IndexedDB for background sync
      storeForBackgroundSync({
        url: request.url,
        method: request.method,
        headers: Object.fromEntries(request.headers.entries()),
        body,
        timestamp: Date.now(),
      })

      // Register background sync
      self.registration.sync.register("background-sync")
    }

    throw error
  }
}

/**
 * Background sync event
 */
self.addEventListener("sync", (event) => {
  if (event.tag === "background-sync") {
    event.waitUntil(processBackgroundSync())
  }
})

/**
 * Process background sync queue
 */
async function processBackgroundSync() {
  const requests = await getStoredSyncRequests()

  for (const syncRequest of requests) {
    try {
      const response = await fetch(syncRequest.url, {
        method: syncRequest.method,
        headers: syncRequest.headers,
        body: syncRequest.body,
      })

      if (response.ok) {
        await removeStoredSyncRequest(syncRequest.id)
      }
    } catch (error) {
      console.error("Background sync failed for request:", syncRequest, error)
    }
  }
}

/**
 * Push notification event
 */
self.addEventListener("push", (event) => {
  if (event.data) {
    const data = event.data.json()

    const options = {
      body: data.body,
      icon: "/icons/icon-192x192.png",
      badge: "/icons/badge-72x72.png",
      tag: data.tag,
      data: data.data,
      actions: data.actions || [],
    }

    event.waitUntil(
      self.registration.showNotification(data.title, options)
    )
  }
})

/**
 * Notification click event
 */
self.addEventListener("notificationclick", (event) => {
  const notification = event.notification
  const action = event.action
  const data = notification.data

  notification.close()

  if (action === "open") {
    // Open the app to specific URL
    event.waitUntil(
      clients.openWindow(data.url || "/")
    )
  } else if (action === "dismiss") {
    // Just dismiss the notification
    return
  } else {
    // Default action - open the app
    event.waitUntil(
      clients.matchAll({ type: "window" })
        .then((clientList) => {
          // Focus existing window if available
          for (const client of clientList) {
            if (client.url === data.url && "focus" in client) {
              return client.focus()
            }
          }
          // Open new window
          if (clients.openWindow) {
            return clients.openWindow(data.url || "/")
          }
        })
    )
  }
})

/**
 * IndexedDB helpers for background sync
 */
async function storeForBackgroundSync(syncRequest: Record<string, unknown>) {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open("AfendaBackgroundSync", 1)

    request.onerror = () => reject(request.error)
    request.onsuccess = () => {
      const db = request.result
      const transaction = db.transaction(["syncQueue"], "readwrite")
      const store = transaction.objectStore("syncQueue")

      const addRequest = store.add({
        ...syncRequest,
        id: Math.random().toString(36).substr(2, 9),
      })

      addRequest.onsuccess = () => resolve(addRequest.result)
      addRequest.onerror = () => reject(addRequest.error)
    }

    request.onupgradeneeded = () => {
      const db = request.result
      db.createObjectStore("syncQueue", { keyPath: "id" })
    }
  })
}

async function getStoredSyncRequests() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open("AfendaBackgroundSync", 1)

    request.onerror = () => reject(request.error)
    request.onsuccess = () => {
      const db = request.result
      const transaction = db.transaction(["syncQueue"], "readonly")
      const store = transaction.objectStore("syncQueue")

      const getRequest = store.getAll()

      getRequest.onsuccess = () => resolve(getRequest.result)
      getRequest.onerror = () => reject(getRequest.error)
    }
  })
}

async function removeStoredSyncRequest(id) {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open("AfendaBackgroundSync", 1)

    request.onerror = () => reject(request.error)
    request.onsuccess = () => {
      const db = request.result
      const transaction = db.transaction(["syncQueue"], "readwrite")
      const store = transaction.objectStore("syncQueue")

      const deleteRequest = store.delete(id)

      deleteRequest.onsuccess = () => resolve(deleteRequest.result)
      deleteRequest.onerror = () => reject(deleteRequest.error)
    }
  })
}
