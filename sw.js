// ================================================================
// SERVICE WORKER — Zero-config auto-update
// Tidak perlu ubah versi manual. Cukup deploy file baru.
//
// CARA KERJANYA:
// 1. Browser auto-cek sw.js setiap halaman dibuka & setiap 24 jam
// 2. Jika sw.js berubah (byte apapun berbeda) → SW baru di-install
// 3. skipWaiting() → SW baru langsung aktif, tidak nunggu tab tutup
// 4. clients.claim() → semua tab langsung pakai SW baru
// 5. Saat aktivasi → hapus SEMUA cache lama otomatis
// 6. Network-first → selalu ambil file terbaru dari server
//
// HASIL: Deploy file → user dapat versi baru otomatis, tanpa apapun
// ================================================================

const CACHE_NAME = 'solana-tracker-cache';

// File yang di-pre-cache untuk offline fallback
const PRECACHE_ASSETS = [
    '/',
    '/index.html',
    '/style.css',
    '/app.js',
    '/manifest.json',
    '/icon.png'
];

// ----------------------------------------------------------------
// INSTALL — Pre-cache assets, lalu skipWaiting langsung
// skipWaiting = tidak tunggu tab ditutup, SW baru langsung aktif
// ----------------------------------------------------------------
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => cache.addAll(PRECACHE_ASSETS))
            .then(() => self.skipWaiting())   // <-- kunci auto-update
    );
});

// ----------------------------------------------------------------
// ACTIVATE — Hapus cache lama, ambil kontrol semua tab
// clients.claim = langsung berlaku tanpa perlu reload manual
// ----------------------------------------------------------------
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys()
            .then(keys => Promise.all(
                keys
                    .filter(key => key !== CACHE_NAME)
                    .map(key => caches.delete(key))   // hapus cache lama
            ))
            .then(() => self.clients.claim())          // <-- kontrol semua tab
    );
});

// ----------------------------------------------------------------
// FETCH — Network-first untuk semua request ke origin sendiri
// Ambil dari network dulu (selalu dapat versi terbaru),
// simpan ke cache sebagai fallback offline.
// Request ke API eksternal (DexScreener, Helius) tidak di-cache.
// ----------------------------------------------------------------
self.addEventListener('fetch', (event) => {
    // Hanya handle GET
    if (event.request.method !== 'GET') return;

    const url = new URL(event.request.url);

    // Skip request ke API eksternal — jangan di-cache
    const isExternal = url.origin !== self.location.origin;
    if (isExternal) return;

    event.respondWith(
        fetch(event.request)
            .then(response => {
                // Hanya cache response yang valid (bukan 404/500)
                if (response.ok) {
                    const clone = response.clone();
                    caches.open(CACHE_NAME)
                        .then(cache => cache.put(event.request, clone));
                }
                return response;
            })
            .catch(() => {
                // Offline: coba dari cache
                return caches.match(event.request)
                    .then(cached => cached || caches.match('/index.html'));
            })
    );
});

// ----------------------------------------------------------------
// MESSAGE — Opsional: terima sinyal force-update dari halaman
// (tidak wajib karena skipWaiting sudah otomatis di install)
// ----------------------------------------------------------------
self.addEventListener('message', (event) => {
    if (event.data && event.data.type === 'SKIP_WAITING') {
        self.skipWaiting();
    }
});
