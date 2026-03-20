const HELIUS_API_KEY = "b9fce816-011e-4502-91e4-f858655d32d3";
const coinList = document.getElementById('coinList');
const refreshBtn = document.getElementById('refreshBtn');

async function fetchNewCoins() {
    coinList.innerHTML = '<div style="text-align:center; padding:50px; color:#14f195;">🔍 Mencari Koin Micin Solana Terbaru...</div>';
    
    try {
        // Kita ambil "Latest Pairs" (Koin yang baru saja listing di Dex manapun)
        const response = await fetch('https://api.dexscreener.com/dex/latest-pairs');
        const data = await response.json();
        
        // FILTER: Hanya ambil yang dari chain 'solana'
        const solanaOnly = data.pairs.filter(pair => pair.chainId === 'solana');

        if (solanaOnly && solanaOnly.length > 0) {
            displayCoins(solanaOnly);
        } else {
            coinList.innerHTML = '<div style="text-align:center; padding:20px;">Belum ada koin baru di Solana detik ini. Tunggu sebentar.</div>';
        }
    } catch (error) {
        console.error("Error:", error);
        coinList.innerHTML = '<div style="text-align:center; color:red;">Koneksi API Gagal. Coba lagi.</div>';
    }
}

function displayCoins(pairs) {
    coinList.innerHTML = '<div class="grid" id="grid"></div>';
    const grid = document.getElementById('grid');

    // Tampilkan 15 koin terbaru
    pairs.slice(0, 15).forEach(pair => {
        const ca = pair.baseToken.address;
        const symbol = pair.baseToken.symbol;
        const name = pair.baseToken.name;
        const price = '$' + parseFloat(pair.priceUsd).toFixed(8);
        const h1 = pair.priceChange?.h1 || 0;

        const card = document.createElement('div');
        card.className = 'card';
        card.style.borderLeft = h1 > 0 ? '4px solid #14f195' : '4px solid #ff4b4b';
        
        card.innerHTML = `
            <div class="badge-trend" style="background:${h1 >= 0 ? '#9945FF' : '#444'}">
                ${h1 >= 0 ? '🚀 ' + h1 + '%' : '📉 ' + h1 + '%'}
            </div>
            <p style="font-size: 0.7rem; color: #888; margin: 0;">${symbol} / SOL</p>
            <h3 class="name" style="margin:5px 0; color:white; font-size:1rem;">${name}</h3>
            <div class="price" style="color:#14f195; font-size:1.1rem; font-weight:bold;">${price}</div>
            
            <div id="sec-${ca}" style="margin-top:10px; padding:8px; background:#1a1a1a; border-radius:8px; font-size:0.7rem; color:#aaa;">
                ⏳ Memeriksa Otoritas...
            </div>

            <div class="ca-box" style="background:#1a1a1a; padding:8px; border-radius:6px; font-size:0.7rem; margin:10px 0; word-break:break-all; border:1px dashed #333; color:#14f195; cursor:pointer;" onclick="navigator.clipboard.writeText('${ca}'); alert('CA Copied!')">
                ${ca}
            </div>

            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 5px; margin-top:10px;">
                <button class="btn-action" style="background:#00f2ff; color:black; font-weight:bold; padding:8px; border:none; border-radius:5px;" onclick="window.open('https://gmgn.ai/sol/token/${ca}', '_blank')">📱 GMGN</button>
                <button class="btn-action" style="background:#ff9900; color:black; font-weight:bold; padding:8px; border:none; border-radius:5px;" onclick="window.open('https://jup.ag/swap/SOL-${ca}', '_blank')">🪐 Jup</button>
                <button class="btn-action" style="background:#444; color:white; font-weight:bold; padding:8px; border:none; border-radius:5px;" onclick="window.open('https://rugcheck.xyz/tokens/${ca}', '_blank')">🛡️ Rug</button>
                <button class="btn-action" style="background:#222; color:white; font-weight:bold; padding:8px; border:none; border-radius:5px;" onclick="window.open('${pair.url}', '_blank')">📈 Chart</button>
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
                ${x ? `<a href="${x}" target="_blank" style="color:#1da1f2; text-decoration:none; font-weight:bold;">[X]</a>` : '<span style="color:#444">[No X]</span>'}
            </div>
        `;
    } catch (e) { secDiv.innerHTML = "Security: N/A"; }
}

fetchNewCoins();
setInterval(fetchNewCoins, 30000);
refreshBtn.addEventListener('click', fetchNewCoins);