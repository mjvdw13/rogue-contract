// The service worker. All it does is add two headers to the site's own
// files as they load:
//
//   Cross-Origin-Opener-Policy: same-origin
//   Cross-Origin-Embedder-Policy: require-corp
//
// With them the page is "cross-origin isolated", which browsers ask for
// before a page may share memory with worker threads, and the renderer
// draws on several threads at once (src/engine/render/pool.js). A server
// would normally send them; GitHub Pages can't be told to. Nothing is
// cached here, and everything else goes to the network untouched.
// src/main.js registers it.
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (e) => e.waitUntil(self.clients.claim()));
self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== self.location.origin) return;
  e.respondWith(
    fetch(req).then((res) => {
      // (A response whose headers can't be read or changed goes as it is.)
      if (res.status === 0 || res.type === 'opaque' || res.type === 'opaqueredirect') return res;
      const headers = new Headers(res.headers);
      headers.set('Cross-Origin-Opener-Policy', 'same-origin');
      headers.set('Cross-Origin-Embedder-Policy', 'require-corp');
      return new Response(res.status === 204 || res.status === 304 ? null : res.body, { status: res.status, statusText: res.statusText, headers });
    }),
  );
});
