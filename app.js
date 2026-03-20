const HELIUS_API_KEY = "b9fce816-011e-4502-91e4-f858655d32d3";
const coinList = document.getElementById('coinList');
const refreshBtn = document.getElementById('refreshBtn');

async function fetchNewCoins() {
    coinList.innerHTML = '<div style="text-align:center; padding:50px; color:#14f195;">🔍 Memindai Token Solana Terupdate...</div>';
    
    try {
        // Langsung tembak ke DexScreener tanpa Proxy (lebih stabil jika internet lancar)
        const response = await fetch('https://api.dexscreener.com/latest/dex/tokens/solana');
        const data = await response.json();
        
        if (data.pairs && data.pairs.length > 0) {
            // Urutkan berdasarkan volume 24 jam tertinggi
            const sorted = data.pairs.sort((a, b) => (b.volume?.h24 || 0) - (a.volume?.h24 || 0));
            displayCoins(sorted);
        } else {
            coinList.innerHTML = '<div style="text-align:center; padding:20px;">Data tidak ditemukan. Coba lagi dalam 10 detik.</div>';
        }
    } catch (error) {
        console.error("Fetch Error:", error);
        coinList.innerHTML = '<div style="text-align:center; color:red;">Koneksi API Gagal. Pastikan internet lancar atau matikan VPN.</div>';
    }
}

async function displayCoins(pairs) {
    coinList.innerHTML = '<div class="grid" id="grid"></div>';
    const grid = document.getElementById('grid');

    pairs.slice(0, 15).forEach(async (pair) => {
        const ca = pair.baseToken.address;
        const liq = pair.liquidity?.usd || 0;
        const vol = pair.volume?.h24 || 0;
        const vlRatio = liq > 0 ? (vol / liq).toFixed(2) : 0;
        const h1Change = pair.priceChange?.h1 || 0;

        const card = document.createElement('div');
        card.className = 'card';
        card.style.borderLeft = h1Change > 20 ? '4px solid #9945FF' : '4px solid #14f195';
        
        card.innerHTML = `
            <div class="badge-trend" style="background:${h1Change >= 0 ? '#9945FF' : '#444'}">
                ${h1Change >= 0 ? '🔥 ' + h1Change + '%' : '📉 ' + h1Change + '%'}
            </div>
            
            <p style="font-size: 0.7rem; color: #888; margin: 0;">${pair.baseToken.symbol} / SOL</p>
            <h3 class="name" style="margin:5px 0; color:white; font-size:1rem;">${pair.baseToken.name}</h3>
            
            <div class="price" style="color:#14f195; font-size:1.2rem; font-weight:bold;">$${parseFloat(pair.priceUsd).toFixed(8)}</div>
            
            <div style="font-size: 0.8rem; margin: 10px 0; display:flex; justify-content:space-between; color:#aaa;">
                <span>Liq: $${Math.round(liq).toLocaleString()}</span>
                <span style="color:${vlRatio > 15 ? '#ff4b4b' : '#aaa'}">V/L: ${vlRatio}</span>
            </div>

            <div id="sec-${ca}" style="margin-top:10px; padding:8px; background:#1a1a1a; border-radius:8px; font-size:0.75rem;">
                ⏳ Mengecek Keamanan...
            </div>

            <div class="ca-box" style="background:#1a1a1a; padding:8px; border-radius:6px; font-size:0.7rem; margin:10px 0; word-break:break-all; border:1px dashed #333; color:#14f195; cursor:pointer;" onclick="navigator.clipboard.writeText('${ca}'); alert('CA Copied!')">
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

        // Panggil Helius untuk data keamanan & Sosial
        fetchHeliusData(ca);
    });
}

async function fetchHeliusData(mint) {
    const secDiv = document.getElementById(`sec-${mint}`);
    try {
        const response = await fetch(`https://api.helius.xyz/v0/token-metadata?api-key=${HELIUS_API_KEY}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ mintAccounts: [mint] }),
        });
        const data = await response.json();
        const info = data[0]?.onChainData?.data || {};
        const offChain = data[0]?.offChainData || {};

        let html = `<div style="display:flex; justify-content:space-around; margin-bottom:5px;">
            <span>${data[0]?.onChainData?.mintAuthority ? '⚠️ Mint' : '✅ Mint'}</span>
            <span>${data[0]?.onChainData?.freezeAuthority ? '⚠️ Freeze' : '✅ Freeze'}</span>
        </div>`;

        if (offChain.twitter || offChain.telegram || offChain.website) {
            html += `<div style="display:flex; gap:10px; border-top:1px solid #333; padding-top:5px; justify-content:center;">
                ${offChain.twitter ? `<a href="${offChain.twitter}" target="_blank" style="text-decoration:none; color:#1da1f2;">Twitter</a>` : ''}
                ${offChain.telegram ? `<a href="${offChain.telegram}" target="_blank" style="text-decoration:none; color:#0088cc;">TG</a>` : ''}
                ${offChain.website ? `<a href="${offChain.website}" target="_blank" style="text-decoration:none; color:#14f195;">Web</a>` : ''}
            </div>`;
        } else {
            html += `<div style="text-align:center; color:#666;">No social links found</div>`;
        }
        secDiv.innerHTML = html;
    } catch (e) {
        secDiv.innerHTML = "Security data unavailable";
    }
}

fetchNewCoins();
setInterval(fetchNewCoins, 30000);
refreshBtn.addEventListener('click', fetchNewCoins);