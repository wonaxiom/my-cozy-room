// =============================================================
// sw.js — 앱 설치용 서비스 워커
// 설치(앱으로 열기)에 필요한 최소한만 합니다. 파일을 따로 저장해 두지 않아서
// 업데이트는 지금처럼 바로바로 반영됩니다. (같은 사이트 요청은 그대로 인터넷에서 받아 옴)
// =============================================================
self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (e) => e.waitUntil(self.clients.claim()));
self.addEventListener("fetch", (e) => {
  if (e.request.method !== "GET" || new URL(e.request.url).origin !== location.origin) return;
  e.respondWith(fetch(e.request));
});
