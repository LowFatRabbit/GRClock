// 시계 놀이 오프라인용 서비스 워커 v5
// - 화면(index.html): 인터넷이 되면 새 버전을 받고, 안 되면 저장된 버전으로 실행
// - 아이콘 등 나머지 파일: 저장된 것을 바로 사용
const CACHE = 'clock-play-v5';
const ASSETS = ['./', './index.html', './manifest.webmanifest', './icon-180.png', './icon-192.png', './icon-512.png'];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(ASSETS)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

function fromCache(req) {
  return caches.match(req, { ignoreSearch: true })
    .then((hit) => hit || caches.match('./index.html'))
    .then((hit) => hit || caches.match('./'));
}

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== location.origin) return;

  if (req.mode === 'navigate') {
    const network = fetch(req).then((res) => {
      if (res && res.ok) {
        const copy = res.clone();
        caches.open(CACHE).then((c) => c.put('./index.html', copy));
      }
      return res;
    });
    const timeout = new Promise((resolve) => setTimeout(resolve, 3000));
    e.respondWith(
      Promise.race([network, timeout])
        .then((res) => res || fromCache(req))
        .catch(() => fromCache(req))
    );
    return;
  }

  e.respondWith(
    caches.match(req, { ignoreSearch: true }).then((hit) =>
      hit || fetch(req).then((res) => {
        if (res && res.ok) {
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put(req, copy));
        }
        return res;
      })
    )
  );
});
