const coinList = document.getElementById('coinList');
const refreshBtn = document.getElementById('refreshBtn');

async function fetchNewCoins() {
    coinList.innerHTML = '<div style="text-align:center; padding:50px; color:#14f195;">🔍 Memaksa Masuk ke Blockchain Solana...</div>';
    
    try {
        // Kita pakai jalur "Latest Pairs" yang lebih stabil
        const response = await fetch('https://api.dexscreener.com/token-boosts/latest/v1');
        const data = await response.json();
        
        // Filter hanya yang ada di chain 'solana'
        const solanaPairs = data.filter(item => item.chainId === 'solana');

        if (solanaPairs && solanaPairs.length > 0) {
            displayCoins(solanaPairs);
        } else {
            // Jika jalur boost kosong, kita coba jalur cadangan terakhir
            const backupRes = await fetch('https://api.dexscreener.com/token-profiles/latest/v1');
            const backupData = await backupRes.json();
            const backupSol = backupData.filter(item => item.chainId === 'solana');
            displayCoins(backupSol);
        }
    } catch (error) {
        console.error("Fetch Error:", error);
        coinList.innerHTML = '<div style="text-align:center; color:red;">Koneksi API Gagal. Coba lagi sebentar lagi.</div>';
    }
}

function displayCoins(items) {
    coinList.innerHTML = '<div class="grid" id="grid"></div>';
    const grid = document.getElementById('grid');

    items.slice(0, 20).forEach(item => {
        const ca = item.tokenAddress;
        const card = document.createElement('div');
        card.className = 'card';
        
        card.innerHTML = `
            <div class="badge-trend">NEW LISTING</div>
            <p style="font-size: 0.7rem; color: #888; margin: 0;">SOLANA NETWORK</p>
            <h3 class="name" style="margin:5px 0; color:white;">${item.symbol || 'NEW COIN'}</h3>
            <div class="price" style="color:#14f195; font-size:1.2rem; font-weight:bold;">$${item.amount ? item.amount : 'Check Chart'}</div>
            
            <div class="ca-box" style="background:#1a1a1a; padding:8px; border-radius:6px; font-size:0.7rem; margin:10px 0; word-break:break-all; border:1px dashed #333; color:#14f195; cursor:pointer;" onclick="navigator.clipboard.writeText('${ca}'); alert('CA Copied!')">
                ${ca}
            </div>

            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 5px;">
                <button class="btn-action" style="background:#00f2ff; color:black; padding:8px; border:none; border-radius:5px; font-weight:bold; cursor:pointer;" onclick="window.open('https://gmgn.ai/sol/token/${ca}', '_blank')">📱 GMGN</button>
                <button class="btn-action" style="background:#ff9900; color:black; padding:8px; border:none; border-radius:5px; font-weight:bold; cursor:pointer;" onclick="window.open('https://jup.ag/swap/SOL-${ca}', '_blank')">🪐 Jup</button>
                <button class="btn-action" style="background:#444; color:white; padding:8px; border:none; border-radius:5px; font-weight:bold; cursor:pointer;" onclick="window.open('https://rugcheck.xyz/tokens/${ca}', '_blank')">🛡️ Rug</button>
                <button class="btn-action" style="background:#222; color:white; padding:8px; border:none; border-radius:5px; font-weight:bold; cursor:pointer;" onclick="window.open('${item.url}', '_blank')">📈 Chart</button>
            </div>
        `;
        grid.appendChild(card);
    });
}

fetchNewCoins();
setInterval(fetchNewCoins, 30000);
refreshBtn.addEventListener('click', fetchNewCoins);