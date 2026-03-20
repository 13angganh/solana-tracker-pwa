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
        const liq = pair.liquidity?.usd || 0;
        const vol = pair.volume?.h24 || 0;
        const vlRatio = liq > 0 ? (vol / liq).toFixed(2) : 0;
        
        // INDIKATOR KEAMANAN DASAR
        // 1. V/L Ratio terlalu tinggi (>50) biasanya indikator volume palsu/wash trade
        const isSuspicious = vlRatio > 50; 
        // 2. Liquidity terlalu kecil (< $5000) sangat rawan rugpull
        const isLowLiq = liq < 5000;

        const card = document.createElement('div');
        card.className = `card ${vlRatio > 5 ? 'trending' : ''}`;
        
        card.innerHTML = `
            <div class="badge-trend" style="background: ${isSuspicious ? 'red' : 'var(--sol-purple)'}">
                ${isSuspicious ? '⚠️ HIGH RISK' : '📊 V/L: ' + vlRatio}
            </div>
            
            <p style="font-size: 0.7rem; color: #888; margin: 0;">${pair.baseToken.symbol} / SOL</p>
            <h3 class="name">${pair.baseToken.name}</h3>
            
            <div class="price">$${parseFloat(pair.priceUsd).toFixed(8)}</div>
            
            <div style="font-size: 0.8rem; margin-bottom: 10px;">
                <span style="color: ${isLowLiq ? 'red' : '#aaa'}">
                    Liq: $${Math.round(liq).toLocaleString()} ${isLowLiq ? '(Too Low!)' : ''}
                </span>
            </div>

            <div class="ca-box" style="background:#1a1a1a; color: #14f195;">
                ${pair.baseToken.address}
            </div>

            <div style="display:flex; justify-content: space-between; margin-top: 10px;">
                <button class="btn-action" onclick="window.open('https://rugcheck.xyz/tokens/${pair.baseToken.address}', '_blank')" style="background: #444;">🛡️ RugCheck</button>
                <button class="btn-action" onclick="window.open('${pair.url}', '_blank')">📈 Chart</button>
            </div>
            
            <button class="btn-action" style="width:100%; margin-top:5px;" onclick="navigator.clipboard.writeText('${pair.baseToken.address}'); alert('CA Copied!')">📋 Copy Address</button>
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