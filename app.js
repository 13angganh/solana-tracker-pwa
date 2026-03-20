const HELIUS_API_KEY = "b9fce816-011e-4502-91e4-f858655d32d3";
const coinList = document.getElementById('coinList');
const refreshBtn = document.getElementById('refreshBtn');

// ============================================================
// HELPER: Ekstrak nama dari data DexScreener token-profiles
// Endpoint ini TIDAK punya field .symbol — harus pakai cara lain
// ============================================================
function extractName(item) {
    // 1. Coba ambil dari .description — biasanya "TokenName - description"
    if (item.description && item.description.trim().length > 0) {
        // Ambil bagian sebelum " - " atau " | " atau newline
        const desc = item.description.trim();
        const short = desc.split(/[\-\|\n]/)[0].trim();
        // Validasi: bukan CA address (bukan base58 panjang), max 20 karakter
        if (short.length > 0 && short.length <= 25 && !isBase58Address(short)) {
            return short.toUpperCase();
        }
    }

    // 2. Coba ambil dari .header (judul gambar banner kadang ada nama)
    // (field ini ada di beberapa token)
    if (item.header && item.header.length < 30) {
        return item.header.toUpperCase();
    }

    // 3. Fallback: tampilkan 6 karakter pertama CA + "..."
    const ca = item.tokenAddress || "";
    if (ca.length > 0) {
        return ca.slice(0, 6).toUpperCase() + "...";
    }

    return "NEW GEM";
}

function isBase58Address(str) {
    // Alamat Solana: 32-44 karakter base58
    return /^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(str);
}

async function fetchNewCoins() {
    coinList.innerHTML = '<div style="text-align:center; padding:50px; color:#14f195;">🔍 Mencari Solana Gems...</div>';
    try {
        const response = await fetch('https://api.dexscreener.com/token-profiles/latest/v1');
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const data = await response.json();

        // data bisa array langsung atau object dengan .data
        const list = Array.isArray(data) ? data : (data.data || []);
        const solanaGems = list.filter(item => item.chainId === 'solana');

        if (solanaGems.length > 0) {
            displayCoins(solanaGems);
        } else {
            coinList.innerHTML = '<div style="text-align:center; padding:20px; color:#aaa;">Data kosong, coba refresh...</div>';
        }
    } catch (error) {
        console.error('fetchNewCoins error:', error);
        coinList.innerHTML = `<div style="text-align:center; color:#ff4b4b; padding:20px;">❌ Koneksi Error: ${error.message}</div>`;
    }
}

function displayCoins(items) {
    coinList.innerHTML = '<div class="grid" id="grid"></div>';
    const grid = document.getElementById('grid');

    items.slice(0, 15).forEach(item => {
        const ca = item.tokenAddress || "";
        const icon = item.icon || "";

        // NAMA: pakai helper yang benar
        const finalName = extractName(item);

        // LINKS: guard undefined
        const links = Array.isArray(item.links) ? item.links : [];
        const xLink = links.find(l => l.type === 'twitter')?.url || "";
        const tgLink = links.find(l => l.type === 'telegram')?.url || "";
        const websiteLink = links.find(l => l.type === 'website')?.url || "";

        const card = document.createElement('div');
        card.className = 'card';
        card.innerHTML = `
            <div class="badge-trend" style="background:#9945FF">SOLANA GEMS</div>
            <div style="display:flex; align-items:center; gap:12px; margin-bottom:10px;">
                ${icon
                    ? `<img src="${icon}" style="width:45px; height:45px; border-radius:50%; border:2px solid #14f195;" onerror="this.style.display='none'">`
                    : '<div style="width:45px; height:45px; background:#333; border-radius:50%; flex-shrink:0;"></div>'
                }
                <div>
                    <h3 class="name" style="margin:0; color:white; font-size:1.1rem; text-transform:uppercase;">${finalName}</h3>
                    <div style="font-size:0.65rem; color:#666; margin-top:3px;">${ca.slice(0,8)}...${ca.slice(-6)}</div>
                </div>
            </div>
            <div id="sec-${ca}" style="margin-top:10px; padding:8px; background:#1a1a1a; border-radius:8px; font-size:0.75rem; border:1px solid #222;">
                🛡️ Scanning Authority...
            </div>
            <div class="ca-box" onclick="copyCA('${ca}')" title="Klik untuk copy CA">
                📋 ${ca}
            </div>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px;">
                <button class="btn-action" style="background:#00f2ff; color:black;" onclick="window.open('https://gmgn.ai/sol/token/${ca}', '_blank')">📱 GMGN</button>
                <button class="btn-action" style="background:#ff9900; color:black;" onclick="window.open('https://jup.ag/swap/SOL-${ca}', '_blank')">🪐 Jup</button>
                <button class="btn-action" style="background:#444; color:white;" onclick="window.open('https://rugcheck.xyz/tokens/${ca}', '_blank')">🛡️ Rug</button>
                <button class="btn-action" style="background:#222; color:white;" onclick="window.open('${item.url}', '_blank')">📈 Chart</button>
            </div>
            <div style="display:flex; gap:16px; margin-top:15px; justify-content:center; border-top:1px solid #222; padding-top:12px; flex-wrap:wrap;">
                ${xLink ? `<a href="${xLink}" target="_blank" style="color:#1da1f2; text-decoration:none; font-size:0.85rem;">🐦 Twitter</a>` : ''}
                ${tgLink ? `<a href="${tgLink}" target="_blank" style="color:#0088cc; text-decoration:none; font-size:0.85rem;">✈️ Telegram</a>` : ''}
                ${websiteLink ? `<a href="${websiteLink}" target="_blank" style="color:#14f195; text-decoration:none; font-size:0.85rem;">🌐 Website</a>` : ''}
            </div>
        `;
        grid.appendChild(card);

        // Fetch security hanya kalau ada CA
        if (ca) fetchSecurity(ca);
    });
}

function copyCA(ca) {
    navigator.clipboard.writeText(ca).then(() => {
        // Custom toast notification, bukan alert()
        showToast('✅ CA Copied!');
    }).catch(() => {
        // Fallback untuk browser yang block clipboard
        const ta = document.createElement('textarea');
        ta.value = ca;
        document.body.appendChild(ta);
        ta.select();
        document.execCommand('copy');
        document.body.removeChild(ta);
        showToast('✅ CA Copied!');
    });
}

function showToast(msg) {
    let toast = document.getElementById('toast');
    if (!toast) {
        toast = document.createElement('div');
        toast.id = 'toast';
        toast.style.cssText = `
            position:fixed; bottom:30px; left:50%; transform:translateX(-50%);
            background:#14f195; color:#000; padding:10px 20px; border-radius:8px;
            font-weight:bold; z-index:9999; font-size:0.9rem;
            box-shadow: 0 4px 15px rgba(20,241,149,0.4);
            transition: opacity 0.3s;
        `;
        document.body.appendChild(toast);
    }
    toast.textContent = msg;
    toast.style.opacity = '1';
    clearTimeout(toast._timer);
    toast._timer = setTimeout(() => { toast.style.opacity = '0'; }, 2000);
}

async function fetchSecurity(mint) {
    const secDiv = document.getElementById(`sec-${mint}`);
    if (!secDiv) return;
    try {
        const response = await fetch(`https://api.helius.xyz/v0/token-metadata?api-key=${HELIUS_API_KEY}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ mintAccounts: [mint] }),
        });
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const data = await response.json();
        const d = (Array.isArray(data) ? data[0] : data) || {};

        // Ambil nama dari Helius jika ada — update nama di card!
        const heliusName = d.onChainData?.data?.name || d.legacyMetadata?.name || "";
        if (heliusName && heliusName.trim().length > 0 && !isBase58Address(heliusName.trim())) {
            // Update nama di card dengan data Helius yang lebih akurat
            const card = secDiv.closest('.card');
            if (card) {
                const nameEl = card.querySelector('.name');
                if (nameEl) nameEl.textContent = heliusName.trim().toUpperCase();
            }
        }

        const isMint = d.onChainData?.mintAuthority === null;
        const isFreeze = d.onChainData?.freezeAuthority === null;
        const supply = d.onChainData?.supply;
        const supplyText = supply ? `Supply: ${Number(supply).toLocaleString()}` : '';

        secDiv.innerHTML = `
            <div style="display:flex; justify-content:space-between; align-items:center;">
                <span style="color:${isMint ? '#14f195' : 'orange'}">${isMint ? '✅ Mint Off' : '⚠️ Mint On'}</span>
                <span style="color:${isFreeze ? '#14f195' : 'orange'}">${isFreeze ? '✅ Freeze Off' : '⚠️ Freeze On'}</span>
            </div>
            ${supplyText ? `<div style="font-size:0.65rem; color:#666; margin-top:4px; text-align:center;">${supplyText}</div>` : ''}
        `;
    } catch (e) {
        console.error('fetchSecurity error:', e);
        if (secDiv) secDiv.innerHTML = '<span style="color:#666; font-size:0.7rem;">Security: N/A</span>';
    }
}

// =====================
// PWA Install Handler
// =====================
let deferredPrompt = null;
const installBtn = document.getElementById('installBtn');

window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
    if (installBtn) installBtn.style.display = 'block';
});

if (installBtn) {
    installBtn.addEventListener('click', async () => {
        if (!deferredPrompt) return;
        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        if (outcome === 'accepted') installBtn.style.display = 'none';
        deferredPrompt = null;
    });
}

// =====================
// Init
// =====================
fetchNewCoins();
setInterval(fetchNewCoins, 30000);
refreshBtn.addEventListener('click', fetchNewCoins);
