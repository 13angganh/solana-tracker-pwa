// ================================================================
// app.js — Solana Early Tracker
// PWA logic (install button, SW update) ada di index.html
// File ini HANYA berisi logika data & render
// ================================================================

const HELIUS_API_KEY = "b9fce816-011e-4502-91e4-f858655d32d3";

// Cache hasil Helius di memori — supaya tidak re-fetch tiap interval
// dan tidak habiskan API credits
const heliusCache = new Map();

// Referensi DOM
const coinList   = document.getElementById('coinList');
const refreshBtn = document.getElementById('refreshBtn');

// Timer auto-refresh (disimpan agar bisa di-reset)
let autoRefreshTimer = null;

// ----------------------------------------------------------------
// Helpers
// ----------------------------------------------------------------

function isBase58Address(str) {
    return /^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(str);
}

// Nama sementara dari description sambil tunggu Helius
function extractTempName(item) {
    if (item.description && item.description.trim().length > 0) {
        const firstWord = item.description.trim().split(/[\s\-\|\n.,!?]/)[0].trim();
        if (
            firstWord.length >= 2 &&
            firstWord.length <= 20 &&
            !firstWord.startsWith('http') &&
            !isBase58Address(firstWord)
        ) {
            return firstWord.toUpperCase();
        }
    }
    const ca = item.tokenAddress || '';
    return ca.slice(0, 6).toUpperCase() + '…';
}

// Sanitize string agar aman dimasukkan ke HTML attribute
// (cegah XSS dari data API)
function sanitizeAttr(str) {
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
}

// Validasi URL — hanya izinkan http/https
function safeUrl(url) {
    if (!url) return '';
    try {
        const u = new URL(url);
        return (u.protocol === 'https:' || u.protocol === 'http:') ? url : '';
    } catch {
        return '';
    }
}

// ----------------------------------------------------------------
// Toast notification
// ----------------------------------------------------------------
function showToast(msg, isError = false) {
    let t = document.getElementById('toast');
    if (!t) {
        t = document.createElement('div');
        t.id = 'toast';
        document.body.appendChild(t);
    }
    t.textContent = msg;
    t.style.opacity = '1';
    t.style.background = isError ? 'var(--danger)' : 'var(--sol-green)';
    t.style.color = isError ? '#fff' : '#000';
    clearTimeout(t._timer);
    t._timer = setTimeout(() => { t.style.opacity = '0'; }, 2200);
}

// ----------------------------------------------------------------
// Copy CA
// ----------------------------------------------------------------
function copyCA(ca) {
    const fallback = () => {
        try {
            const ta = document.createElement('textarea');
            ta.value = ca;
            ta.style.cssText = 'position:fixed;opacity:0;';
            document.body.appendChild(ta);
            ta.focus();
            ta.select();
            document.execCommand('copy');
            document.body.removeChild(ta);
            showToast('✅ CA Copied!');
        } catch {
            showToast('❌ Gagal copy', true);
        }
    };

    if (navigator.clipboard && window.isSecureContext) {
        navigator.clipboard.writeText(ca)
            .then(() => showToast('✅ CA Copied!'))
            .catch(fallback);
    } else {
        fallback();
    }
}

// Expose ke global karena dipakai di onclick attribute
window.copyCA = copyCA;

// ----------------------------------------------------------------
// Fetch DexScreener — data token baru
// ----------------------------------------------------------------
async function fetchNewCoins() {
    // Reset timer agar tidak double-fetch
    clearInterval(autoRefreshTimer);

    coinList.innerHTML = '<div class="state-msg loading">🔍 Mencari Solana Gems…</div>';

    try {
        const response = await fetch('https://api.dexscreener.com/token-profiles/latest/v1', {
            cache: 'no-store'   // selalu ambil data terbaru, tidak pakai browser cache
        });
        if (!response.ok) throw new Error(`DexScreener HTTP ${response.status}`);

        const data = await response.json();
        const list = Array.isArray(data) ? data : (data.data || []);
        const solanaGems = list.filter(item => item.chainId === 'solana');

        if (solanaGems.length > 0) {
            displayCoins(solanaGems);
        } else {
            coinList.innerHTML = '<div class="state-msg">📭 Data kosong, coba refresh…</div>';
        }
    } catch (err) {
        console.error('[App] fetchNewCoins error:', err);
        coinList.innerHTML = `<div class="state-msg error">❌ ${err.message}</div>`;
    }

    // Restart timer (60 detik — hemat Helius credits)
    autoRefreshTimer = setInterval(fetchNewCoins, 60000);
}

// ----------------------------------------------------------------
// Render cards
// ----------------------------------------------------------------
function displayCoins(items) {
    coinList.innerHTML = '<div class="grid" id="grid"></div>';
    const grid = document.getElementById('grid');

    items.slice(0, 15).forEach((item, idx) => {
        const ca      = item.tokenAddress || '';
        const icon    = item.icon         || '';
        const itemUrl = safeUrl(item.url) || '';

        const links      = Array.isArray(item.links) ? item.links : [];
        const xLink      = safeUrl(links.find(l => l.type === 'twitter')?.url  || '');
        const tgLink     = safeUrl(links.find(l => l.type === 'telegram')?.url || '');
        const webLink    = safeUrl(links.find(l => l.label === 'Website')?.url || '');

        const tempName   = extractTempName(item);
        const safeCA     = sanitizeAttr(ca);
        const safeItemUrl = sanitizeAttr(itemUrl);

        const card = document.createElement('div');
        card.className = 'card';
        // Stagger animasi
        card.style.animationDelay = `${idx * 40}ms`;

        card.innerHTML = `
            <div class="badge-trend">SOLANA GEMS</div>

            <!-- Icon + Nama -->
            <div style="display:flex;align-items:center;gap:12px;margin-bottom:10px;padding-right:4px;">
                ${icon
                    ? `<img
                            src="${sanitizeAttr(icon)}"
                            alt="token icon"
                            width="45" height="45"
                            style="border-radius:50%;border:2px solid var(--sol-green);flex-shrink:0;object-fit:cover;"
                            onerror="this.replaceWith(document.createElement('div'));this.style='width:45px;height:45px;background:#222;border-radius:50%;flex-shrink:0;'"
                        >`
                    : '<div style="width:45px;height:45px;background:#222;border-radius:50%;flex-shrink:0;"></div>'
                }
                <div style="min-width:0;flex:1;overflow:hidden;">
                    <h3 class="name" id="name-${safeCA}">
                        ${tempName}<span id="spinner-${safeCA}" style="font-size:0.55rem;color:#444;margin-left:4px;">⏳</span>
                    </h3>
                    <div id="ticker-${safeCA}" style="font-size:0.72rem;color:var(--sol-green);margin-top:2px;font-family:monospace;min-height:1em;"></div>
                </div>
            </div>

            <!-- Security scan -->
            <div id="sec-${safeCA}" class="sec-box">
                <span style="color:#444;">🛡️ Scanning…</span>
            </div>

            <!-- CA Box -->
            <div class="ca-box" onclick="copyCA('${safeCA}')" title="Klik untuk copy Contract Address">
                📋&nbsp;${safeCA}
            </div>

            <!-- Action buttons -->
            <div class="btn-grid">
                <button class="btn-action" style="background:#00e8f5;color:#000;"
                    onclick="window.open('https://gmgn.ai/sol/token/${safeCA}','_blank','noopener')">
                    📱 GMGN
                </button>
                <button class="btn-action" style="background:#ff9900;color:#000;"
                    onclick="window.open('https://jup.ag/swap/SOL-${safeCA}','_blank','noopener')">
                    🪐 Jup
                </button>
                <button class="btn-action" style="background:#2a2a2a;color:#fff;"
                    onclick="window.open('https://rugcheck.xyz/tokens/${safeCA}','_blank','noopener')">
                    🛡️ RugCheck
                </button>
                ${itemUrl
                    ? `<button class="btn-action" style="background:#1a1a1a;color:#fff;"
                            onclick="window.open('${safeItemUrl}','_blank','noopener')">
                            📈 Chart
                        </button>`
                    : '<div></div>'
                }
            </div>

            <!-- Social links -->
            ${(xLink || tgLink || webLink) ? `
            <div class="social-links">
                ${xLink    ? `<a href="${sanitizeAttr(xLink)}"   target="_blank" rel="noopener" style="color:#1d9bf0;">🐦 Twitter</a>`  : ''}
                ${tgLink   ? `<a href="${sanitizeAttr(tgLink)}"  target="_blank" rel="noopener" style="color:#0088cc;">✈️ Telegram</a>` : ''}
                ${webLink  ? `<a href="${sanitizeAttr(webLink)}" target="_blank" rel="noopener" style="color:var(--sol-green);">🌐 Website</a>` : ''}
            </div>` : ''}
        `;

        grid.appendChild(card);

        // Fetch Helius hanya jika CA valid
        if (ca && isBase58Address(ca)) {
            fetchSecurity(ca);
        } else if (ca) {
            // CA tidak standard — hapus spinner saja
            const sp = document.getElementById(`spinner-${safeCA}`);
            if (sp) sp.remove();
        }
    });
}

// ----------------------------------------------------------------
// Fetch Helius — nama on-chain & security info
// Pakai in-memory cache agar tidak re-fetch token yang sama
// ----------------------------------------------------------------
async function fetchSecurity(mint) {
    const safeId  = sanitizeAttr(mint);
    const nameEl  = document.getElementById(`name-${safeId}`);
    const tickerEl= document.getElementById(`ticker-${safeId}`);
    const spinnerEl = document.getElementById(`spinner-${safeId}`);
    const secDiv  = document.getElementById(`sec-${safeId}`);

    // Pakai cache jika sudah pernah di-fetch
    if (heliusCache.has(mint)) {
        const cached = heliusCache.get(mint);
        applyHeliusData(cached, nameEl, tickerEl, spinnerEl, secDiv);
        return;
    }

    try {
        const res = await fetch(
            `https://api.helius.xyz/v0/token-metadata?api-key=${HELIUS_API_KEY}`,
            {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ mintAccounts: [mint] })
            }
        );
        if (!res.ok) throw new Error(`Helius HTTP ${res.status}`);

        const data = await res.json();
        const d = (Array.isArray(data) ? data[0] : data) || {};

        // Simpan ke cache
        heliusCache.set(mint, d);
        applyHeliusData(d, nameEl, tickerEl, spinnerEl, secDiv);

    } catch (err) {
        console.warn('[App] fetchSecurity error for', mint, err.message);
        if (secDiv) secDiv.innerHTML = '<span style="color:#333;font-size:0.7rem;">Security: N/A</span>';
        if (spinnerEl) spinnerEl.remove();
    }
}

function applyHeliusData(d, nameEl, tickerEl, spinnerEl, secDiv) {
    // ---- Nama on-chain (sumber paling akurat) ----
    const heliusName = (
        d?.onChainData?.data?.name ||
        d?.legacyMetadata?.name    ||
        ''
    ).trim();

    const heliusSymbol = (
        d?.onChainData?.data?.symbol ||
        d?.legacyMetadata?.symbol    ||
        ''
    ).trim();

    if (nameEl) {
        if (heliusName.length > 0 && !isBase58Address(heliusName)) {
            nameEl.textContent = heliusName.toUpperCase();
        } else {
            // Tidak ada nama di Helius — hapus spinner, biarkan nama sementara
            if (spinnerEl) spinnerEl.remove();
        }
    }

    if (tickerEl && heliusSymbol.length > 0) {
        tickerEl.textContent = `$${heliusSymbol}`;
    }

    // ---- Security ----
    const mintAuth   = d?.onChainData?.mintAuthority;
    const freezeAuth = d?.onChainData?.freezeAuthority;

    // null  = authority sudah di-revoke (aman)
    // value = masih aktif (waspada)
    const isMintOff   = mintAuth   === null;
    const isFreezeOff = freezeAuth === null;

    if (secDiv) {
        secDiv.innerHTML = `
            <div style="display:flex;justify-content:space-between;align-items:center;width:100%;">
                <span style="color:${isMintOff   ? 'var(--sol-green)' : 'orange'};">
                    ${isMintOff   ? '✅ Mint Off'   : '⚠️ Mint On'}
                </span>
                <span style="color:${isFreezeOff ? 'var(--sol-green)' : 'orange'};">
                    ${isFreezeOff ? '✅ Freeze Off' : '⚠️ Freeze On'}
                </span>
            </div>
        `;
    }
}

// ----------------------------------------------------------------
// Init
// ----------------------------------------------------------------
refreshBtn.addEventListener('click', fetchNewCoins);
fetchNewCoins();  // Load pertama saat halaman dibuka
