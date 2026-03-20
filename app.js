const HELIUS_API_KEY = "b9fce816-011e-4502-91e4-f858655d32d3";
const coinList = document.getElementById('coinList');
const refreshBtn = document.getElementById('refreshBtn');

async function fetchNewCoins() {
    coinList.innerHTML = '<div style="text-align:center; padding:50px; color:#14f195;">🔍 Mencari Koin Solana Terbaru...</div>';
    
    try {
        // Kita pakai endpoint search dengan filter 'solana' yang lebih ringan
        const response = await fetch('https://api.dexscreener.com/latest/dex/search?q=solana');
        
        if (!response.ok) throw new Error("Server DexScreener Sibuk");
        
        const data = await response.json();
        
        // Filter: Hanya yang dari chain 'solana' dan BUKAN koin utama (SOL/USDC/USDT)
        const micinOnly = data.pairs.filter(pair => 
            pair.chainId === 'solana' && 
            pair.baseToken.symbol !== 'SOL' && 
            pair.baseToken.symbol !== 'USDC'
        );

        if (micinOnly && micinOnly.length > 0) {
            displayCoins(micinOnly);
        } else {
            coinList.innerHTML = '<div style="text-align:center; padding:20px;">Koin tidak ditemukan. Klik Refresh lagi.</div>';
        }
    } catch (error) {
        console.error("Error Detail:", error);
        coinList.innerHTML = `<div style="text-align:center; color:red; padding:20px;">
            Koneksi Gagal.<br><small>${error.message}</small><br>
            <button onclick="location.reload()" style="margin-top:10px; background:#444; color:white; border:none; padding:5px 10px; border-radius:5px;">Muat Ulang Halaman</button>
        </div>`;
    }
}

function displayCoins(pairs) {
    coinList.innerHTML = '<div class="grid" id="grid"></div>';
    const grid = document.getElementById('grid');

    pairs.slice(0, 15).forEach(pair => {
        const ca = pair.baseToken.address;
        const card = document.createElement('div');
        card.className = 'card';
        const h1 = pair.priceChange?.h1 || 0;
        
        card.innerHTML = `
            <div class="badge-trend" style="background:${h1 >= 0 ? '#9945FF' : '#444'}">
                ${h1 >= 0 ? '🚀 ' + h1 + '%' : '📉 ' + h1 + '%'}
            </div>
            <p style="font-size: 0.7rem; color: #888; margin: 0;">${pair.baseToken.symbol} / SOL</p>
            <h3 class="name" style="margin:5px 0; color:white; font-size:1rem;">${pair.baseToken.name}</h3>
            <div class="price" style="color:#14f195; font-size:1.1rem; font-weight:bold;">$${parseFloat(pair.priceUsd).toFixed(8)}</div>
            
            <div id="sec-${ca}" style="margin-top:10px; padding:8px; background:#1a1a1a; border-radius:8px; font-size:0.7rem; color:#aaa;">
                🛡️ Cek Keamanan...
            </div>

            <div class="ca-box" onclick="navigator.clipboard.writeText('${ca}'); alert('CA Copied!')" style="background:#1a1a1a; padding:8px; border-radius:6px; font-size:0.7rem; margin:10px 0; word-break:break-all; border:1px dashed #333; color:#14f195; cursor:pointer;">
                ${ca}
            </div>

            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 5px; margin-top:10px;">
                <button class="btn-action" style="background:#00f2ff; color:black; font-weight:bold; padding:8px; border:none; border-radius:5px; cursor:pointer;" onclick="window.open('https://gmgn.ai/sol/token/${ca}', '_blank')">📱 GMGN</button>
                <button class="btn-action" style="background:#ff9900; color:black; font-weight:bold; padding:8px; border:none; border-radius:5px; cursor:pointer;" onclick="window.open('https://jup.ag/swap/SOL-${ca}', '_blank')">🪐 Jup</button>
                <button class="btn-action" style="background:#444; color:white; font-weight:bold; padding:8px; border:none; border-radius:5px; cursor:pointer;" onclick="window.open('https://rugcheck.xyz/tokens/${ca}', '_blank')">🛡️ Rug</button>
                <button class="btn-action" style="background:#222; color:white; font-weight:bold; padding:8px; border:none; border-radius:5px; cursor:pointer;" onclick="window.open('${pair.url}', '_blank')">📈 Chart</button>
            </div>
        `;
        grid.appendChild(card);
        fetchSecurity(ca);
    });
}

async function fetchSecurity(mint) {
    const secDiv = document.getElementById(`sec-${mint}`);
    try {
        const response = await fetch(`https://api.helius.xyz/v0/token-metadata?api-key=${HELIUS_API_KEY}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ mintAccounts: [mint] }),
        });
        const data = await response.json();
        const d = data[0] || {};
        const isMint = d.onChainData?.mintAuthority;
        const isFreeze = d.onChainData?.freezeAuthority;
        const x = d.offChainData?.twitter;

        secDiv.innerHTML = `
            <div style="display:flex; justify-content:space-between;">
                <span>Mint: ${isMint ? '⚠️' : '✅'}</span>
                <span>Freeze: ${isFreeze ? '⚠️' : '✅'}</span>
                ${x ? `<a href="${x}" target="_blank" style="color:#1da1f2; text-decoration:none; font-weight:bold;">[X]</a>` : ''}
            </div>
        `;
    } catch (e) { secDiv.innerHTML = "Security: N/A"; }
}

fetchNewCoins();
setInterval(fetchNewCoins, 45000); // 45 detik biar gak kena limit
refreshBtn.addEventListener('click', fetchNewCoins);