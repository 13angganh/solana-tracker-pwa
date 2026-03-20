const coinList = document.getElementById('coinList');
const refreshBtn = document.getElementById('refreshBtn');

async function fetchNewCoins() {
    coinList.innerHTML = '<div style="text-align:center; padding:50px; color:#14f195;">🔍 Sedang Memindai Solana...</div>';
    
    try {
        // Mengambil 30 pair terbaru di Solana
        const response = await fetch('https://api.dexscreener.com/latest/dex/tokens/solana');
        const data = await response.json();
        
        console.log("Data diterima:", data); // Cek di F12 Console

        if (data.pairs && data.pairs.length > 0) {
            displayCoins(data.pairs);
        } else {
            coinList.innerHTML = '<div style="text-align:center; padding:20px;">DexScreener tidak mengirim data. Coba lagi nanti.</div>';
        }
    } catch (error) {
        console.error("Fetch Error:", error);
        coinList.innerHTML = '<div style="text-align:center; color:red;">Koneksi API Terputus.</div>';
    }
}

function displayCoins(pairs) {
    coinList.innerHTML = '<div class="grid" id="grid"></div>';
    const grid = document.getElementById('grid');

    // Kita ambil 20 data teratas saja
    pairs.slice(0, 20).forEach(pair => {
        const ca = pair.baseToken.address;
        const card = document.createElement('div');
        card.className = 'card';
        
        card.innerHTML = `
            <div class="badge-trend">PRICE CHG: ${pair.priceChange?.h1 || 0}%</div>
            <p style="font-size: 0.7rem; color: #888; margin: 0;">${pair.baseToken.symbol} / SOL</p>
            <h3 class="name" style="margin:5px 0; color:white;">${pair.baseToken.name}</h3>
            <div class="price" style="color:#14f195; font-size:1.2rem; font-weight:bold;">$${parseFloat(pair.priceUsd).toFixed(8)}</div>
            
            <div class="ca-box" style="background:#1a1a1a; padding:8px; border-radius:6px; font-size:0.7rem; margin:10px 0; word-break:break-all; border:1px dashed #333; color:#14f195; cursor:pointer;" onclick="navigator.clipboard.writeText('${ca}'); alert('CA Copied!')">
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

fetchNewCoins();
setInterval(fetchNewCoins, 30000);
refreshBtn.addEventListener('click', fetchNewCoins);