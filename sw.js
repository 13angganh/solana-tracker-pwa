// ================================================================
// SERVICE WORKER — Zero-config auto-update
//
// KENAPA VERSI SEBELUMNYA GAGAL:
// cache.addAll() di install event men-cache file LAMA dulu,
// lalu SW baru aktif tapi tetap serve dari cache lama itu.
//
// FIX:
// - Tidak ada pre-cache di install (tidak ada cache.addAll)
// - Cache terisi organik saat fetch — selalu dari network dulu
// - CACHE_NAME pakai timestamp SW ini dibuat → cache lama
//   pasti berbeda nama → pasti dihapus saat aktivasi
// - skipWaiting langsung → tidak tunggu tab ditutup
// - clients.claim langsung → semua tab pakai SW baru
//
// HASIL: Deploy file → SW baru install → cache lama terhapus
// → semua request ambil dari network → user dapat versi terbaru
// ================================================================

// Timestamp ini berubah setiap kali sw.js di-deploy ulang
// Browser deteksi perubahan byte → install SW baru otomatis
const CACHE_NAME = 'sol-tracker-' + '2025-03-20T15:00:00';

// ----------------------------------------------------------------
// INSTALL — skipWaiting langsung, TANPA pre-cache
// Pre-cache dihilangkan karena justru mengunci versi lama di cache
// ----------------------------------------------------------------
self.addEventListener('install', (event) => {
    event.waitUntil(self.skipWaiting());
});

// ----------------------------------------------------------------
// ACTIVATE — Hapus SEMUA cache lama, lalu claim semua tab
// ----------------------------------------------------------------
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys()
            .then(keys => Promise.all(
                keys
                    .filter(key => key !== CACHE_NAME)
                    .map(key => caches.delete(key))
            ))
            .then(() => self.clients.claim())
    );
});

// ----------------------------------------------------------------
// FETCH — Network-first untuk semua asset lokal
//
// Setiap request ke origin sendiri:
// 1. Ambil dari network (versi terbaru)
// 2. Simpan ke cache sebagai fallback offline
// 3. Jika network gagal (offline) → fallback ke cache
//
// API eksternal (DexScreener, Helius) → bypass SW sepenuhnya
// ----------------------------------------------------------------
self.addEventListener('fetch', (event) => {
    if (event.request.method !== 'GET') return;

    const url = new URL(event.request.url);

    // Bypass: request ke domain lain (API eksternal)
    if (url.origin !== self.location.origin) return;

    // Bypass: chrome-extension atau non-http
    if (!url.protocol.startsWith('http')) return;

    event.respondWith(
        fetch(event.request, { cache: 'no-store' })
            .then(response => {
                // Cache hanya response valid
                if (response.ok && response.status === 200) {
                    const clone = response.clone();
                    caches.open(CACHE_NAME)
                        .then(cache => cache.put(event.request, clone));
                }
                return response;
            })
            .catch(() => {
                // Offline fallback: coba cache
                return caches.match(event.request)
                    .then(cached => cached || caches.match('/index.html'));
            })
    );
});

// ----------------------------------------------------------------
// MESSAGE — Force update dari halaman (tombol "Update Sekarang")
// ----------------------------------------------------------------
self.addEventListener('message', (event) => {
    if (event.data && event.data.type === 'SKIP_WAITING') {
        self.skipWaiting();
    }
});
