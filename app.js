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

function displayCoins(pairs) {
    coinList.innerHTML = '<div class="grid" id="grid"></div>';
    const grid = document.getElementById('grid');

    pairs.slice(0, 20).forEach(pair => {
        const h1Change = pair.priceChange.h1 || 0;
        const isTrending = h1Change > 20; // Indikator: Naik > 20% dalam sejam

        const card = document.createElement('div');
        card.className = `card ${isTrending ? 'trending' : ''}`;
        
        card.innerHTML = `
            ${isTrending ? '<span class="badge-trend">🔥 MOONING</span>' : '<span class="badge-trend" style="background:#444">STABLE</span>'}
            <p style="font-size: 0.7rem; color: #888; margin: 0;">${pair.baseToken.symbol} / SOL</p>
            <h3 class="name">${pair.baseToken.name}</h3>
            <div class="price">$${parseFloat(pair.priceUsd).toFixed(8)}</div>
            
            <div style="font-size: 0.9rem; color: ${h1Change >= 0 ? 'var(--sol-green)' : 'var(--danger)'}">
                1h Change: ${h1Change}%
            </div>

            <div class="ca-box" style="background:#222; padding:5px; font-size:0.7rem; margin-top:10px; word-break:break-all; border-radius:5px;">
                ${pair.baseToken.address}
            </div>

            <div class="stats">
                <span>Liq: $${Math.round(pair.liquidity?.usd || 0).toLocaleString()}</span>
                <span>Vol: $${Math.round(pair.volume?.h24 || 0).toLocaleString()}</span>
            </div>

            <div style="display:flex; justify-content: space-between;">
                <button class="btn-action" onclick="window.open('${pair.url}', '_blank')">Chart</button>
                <button class="btn-action" onclick="navigator.clipboard.writeText('${pair.baseToken.address}'); alert('CA Copied!')">Copy CA</button>
            </div>
        `;
        grid.appendChild(card);
    });
}

// Auto Refresh tiap 30 detik
setInterval(fetchNewCoins, 30000);
refreshBtn.addEventListener('click', fetchNewCoins);
fetchNewCoins();

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