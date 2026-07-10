const CACHE_NAME = 'amar-deen-v1';

// Install Event
self.addEventListener('install', (event) => {
    self.skipWaiting();
});

// Activate Event
self.addEventListener('activate', (event) => {
    event.waitUntil(self.clients.claim());
});

// Fetch Event (Required by Samsung Internet and Firefox to recognize as a real app)
self.addEventListener('fetch', (event) => {
    if (event.request.method !== 'GET') return;
    
    event.respondWith(
        fetch(event.request).catch(() => {
            return new Response('You are offline. Please connect to the internet.');
        })
    );
});

