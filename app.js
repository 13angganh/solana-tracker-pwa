const coinList = document.getElementById('coinList');
const refreshBtn = document.getElementById('refreshBtn');

async function fetchNewCoins() {
    coinList.innerHTML = '<div style="text-align:center; padding:50px;">Memindai Token Terpanas...</div>';
    try {
        // Kita ambil data pair terbaru di Solana
        const response = await fetch('https://api.dexscreener.com/latest/dex/tokens/solana');
        const data = await response.json();
        
        if (data.pairs) {
            // Urutkan berdasarkan perubahan harga 1 jam terakhir (tertinggi di atas)
            const sorted = data.pairs.sort((a, b) => b.priceChange.h1 - a.priceChange.h1);
            displayCoins(sorted);
        }
    } catch (error) {
        coinList.innerHTML = 'Gagal memuat data.';
    }
}

const HELIUS_API_KEY = "b9fce816-011e-4502-91e4-f858655d32d3";

async function checkSecurity(mint) {
    try {
        const response = await fetch(`https://api.helius.xyz/v0/token-metadata?api-key=${HELIUS_API_KEY}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ mintAccounts: [mint] }),
        });
        const data = await response.json();
        const meta = data[0]?.offChainData || {};
        // Logika sederhana: Jika tidak ada data freeze, asumsikan aman (tergantung API response)
        return meta;
    } catch (e) { return null; }
}

function displayCoins(pairs) {
    coinList.innerHTML = '<div class="grid" id="grid"></div>';
    const grid = document.getElementById('grid');

    pairs.slice(0, 15).forEach(pair => {
        const ca = pair.baseToken.address;
        const liq = pair.liquidity?.usd || 0;
        const vol = pair.volume?.h24 || 0;
        const vlRatio = liq > 0 ? (vol / liq).toFixed(2) : 0;

        const card = document.createElement('div');
        card.className = `card ${vlRatio > 3 ? 'trending' : ''}`;
        
        card.innerHTML = `
            <div class="badge-trend">V/L: ${vlRatio}</div>
            <p style="font-size: 0.7rem; color: #888; margin: 0;">${pair.baseToken.symbol} / SOL</p>
            <h3 class="name">${pair.baseToken.name}</h3>
            <div class="price">$${parseFloat(pair.priceUsd).toFixed(8)}</div>
            
            <div class="ca-box" id="ca-${ca}" onclick="navigator.clipboard.writeText('${ca}'); alert('CA Copied!')">
                ${ca}
            </div>

            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 5px; margin-top: 10px;">
                <button class="btn-action" style="background:#00f2ff; color:black;" onclick="window.open('https://gmgn.ai/sol/token/${ca}', '_blank')">📱 GMGN</button>
                <button class="btn-action" style="background:#ff9900; color:black;" onclick="window.open('https://jup.ag/swap/SOL-${ca}', '_blank')">🪐 Jupiter</button>
                <button class="btn-action" onclick="window.open('https://rugcheck.xyz/tokens/${ca}', '_blank')">🛡️ RugCheck</button>
                <button class="btn-action" onclick="window.open('${pair.url}', '_blank')">📈 Chart</button>
            </div>

            <div style="font-size: 0.7rem; color: #aaa; margin-top: 10px; display: flex; justify-content: space-between;">
                <span>Liq: $${Math.round(liq).toLocaleString()}</span>
                <span>Vol: $${Math.round(vol).toLocaleString()}</span>
            </div>
        `;
        grid.appendChild(card);
    });
}

// Logika Instal PWA
let deferredPrompt;
window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
    document.getElementById('installBtn').style.display = 'block';
});

document.getElementById('installBtn').addEventListener('click', async () => {
    if (deferredPrompt) {
        deferredPrompt.prompt();
        deferredPrompt = null;
        document.getElementById('installBtn').style.display = 'none';
    }
});