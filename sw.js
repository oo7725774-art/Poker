// オフラインでも遊べるように全部を保存する。
// ページ本体（index.html）はネットにつながっていれば毎回最新を取りに行き、つながらないときだけ保存版を使う。
const CACHE = "poker-v43";
const FILES = ["./", "index.html", "manifest.webmanifest", "lib/three.min.js", "lib/GLTFLoader.js", "lib/SkeletonUtils.js", "lib/mqtt.min.js",
  "models/male.json", "models/female.json", "icons/icon-192.png", "icons/icon-512.png", "icons/apple-touch-icon.png"];
self.addEventListener("install", e => {
  // ブラウザのキャッシュに残った古い版をつかまないよう、必ずサーバーから取り直す
  e.waitUntil(caches.open(CACHE).then(c => Promise.all(FILES.map(f => fetch(f, {cache: "reload"}).then(r => { if (r.ok) return c.put(f, r); })))).then(() => self.skipWaiting()));
});
self.addEventListener("activate", e => { e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim())); });
const isPage = req => req.mode === "navigate" || /\/(index\.html)?$/.test(new URL(req.url).pathname);
self.addEventListener("fetch", e => {
  const req = e.request;
  if (req.method !== "GET" || new URL(req.url).origin !== location.origin) return;
  if (isPage(req)){
    e.respondWith(fetch(req, {cache: "no-store"}).then(res => {
      if (res.ok){ const copy = res.clone(); caches.open(CACHE).then(c => c.put("index.html", copy)); }
      return res;
    }).catch(() => caches.match("index.html").then(h => h || caches.match("./"))));
    return;
  }
  e.respondWith(caches.match(req, {ignoreSearch: true}).then(hit => hit || fetch(req).then(res => {
    if (res.ok){ const copy = res.clone(); caches.open(CACHE).then(c => c.put(req, copy)); }
    return res;
  })));
});
