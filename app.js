const HELIUS_API_KEY = "b9fce816-011e-4502-91e4-f858655d32d3"; // Kosongkan "" jika belum punya
const coinList = document.getElementById('coinList');
const refreshBtn = document.getElementById('refreshBtn');

async function fetchNewCoins() {
    coinList.innerHTML = '<div style="text-align:center; padding:50px; color:#14f195;">🔍 Sedang Memindai...</div>';
    
    try {
        const response = await fetch('https://api.dexscreener.com/latest/dex/tokens/solana');
        const data = await response.json();
        
        if (data.pairs && data.pairs.length > 0) {
            // Urutkan berdasarkan Volume 24 jam tertinggi
            const sorted = data.pairs.sort((a, b) => (b.volume?.h24 || 0) - (a.volume?.h24 || 0));
            displayCoins(sorted);
        } else {
            coinList.innerHTML = '<div style="text-align:center;">Data tidak ditemukan. Coba lagi.</div>';
        }
    } catch (error) {
        console.error("Error Fetch:", error);
        coinList.innerHTML = '<div style="text-align:center; color:red;">Gagal koneksi ke server DexScreener.</div>';
    }
}

function displayCoins(pairs) {
    coinList.innerHTML = '<div class="grid" id="grid"></div>';
    const grid = document.getElementById('grid');

    pairs.slice(0, 20).forEach(pair => {
        const ca = pair.baseToken.address;
        const liq = pair.liquidity?.usd || 0;
        const vol = pair.volume?.h24 || 0;
        const vlRatio = liq > 0 ? (vol / liq).toFixed(2) : 0;

        const card = document.createElement('div');
        card.className = `card ${vlRatio > 5 ? 'trending' : ''}`;
        
        card.innerHTML = `
            <div class="badge-trend">${vlRatio > 10 ? '🔥 HIGH VOL' : '📊 V/L: ' + vlRatio}</div>
            <p style="font-size: 0.7rem; color: #888; margin: 0;">${pair.baseToken.symbol} / SOL</p>
            <h3 class="name" style="margin:5px 0;">${pair.baseToken.name}</h3>
            <div class="price" style="color:#14f195; font-weight:bold;">$${parseFloat(pair.priceUsd).toFixed(8)}</div>
            
            <div class="ca-box" style="background:#1a1a1a; padding:8px; border-radius:6px; font-size:0.7rem; margin:10px 0; word-break:break-all; cursor:pointer; border:1px dashed #333; color:#14f195;" onclick="navigator.clipboard.writeText('${ca}'); alert('CA Copied!')">
                ${ca}
            </div>

            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 5px;">
                <button class="btn-action" style="background:#00f2ff; color:black; padding:8px; border:none; border-radius:5px; font-weight:bold; cursor:pointer;" onclick="window.open('https://gmgn.ai/sol/token/${ca}', '_blank')">📱 GMGN</button>
                <button class="btn-action" style="background:#ff9900; color:black; padding:8px; border:none; border-radius:5px; font-weight:bold; cursor:pointer;" onclick="window.open('https://jup.ag/swap/SOL-${ca}', '_blank')">🪐 Jup</button>
                <button class="btn-action" style="background:#444; color:white; padding:8px; border:none; border-radius:5px; font-weight:bold; cursor:pointer;" onclick="window.open('https://rugcheck.xyz/tokens/${ca}', '_blank')">🛡️ Rug</button>
                <button class="btn-action" style="background:#222; color:white; padding:8px; border:none; border-radius:5px; font-weight:bold; cursor:pointer;" onclick="window.open('${pair.url}', '_blank')">📈 Chart</button>
            </div>
        `;
        grid.appendChild(card);
    });
}

// Jalankan pencarian pertama
fetchNewCoins();

// Refresh otomatis tiap 30 detik
setInterval(fetchNewCoins, 30000);

// Tombol Refresh Manual
refreshBtn.addEventListener('click', fetchNewCoins);