const HELIUS_API_KEY = "b9fce816-011e-4502-91e4-f858655d32d3";
const coinList = document.getElementById('coinList');
const refreshBtn = document.getElementById('refreshBtn');

async function fetchNewCoins() {
    coinList.innerHTML = '<div style="text-align:center; padding:50px; color:#14f195;">🔍 Mencari New Gems (No Hippo!)...</div>';
    
    try {
        // Kita pakai endpoint profiles terbaru (isinya koin yang baru daftar info sosial)
        const response = await fetch('https://api.dexscreener.com/token-profiles/latest/v1');
        const data = await response.json();
        
        // Filter: Hanya koin dari Solana
        const solanaGems = data.filter(item => item.chainId === 'solana');

        if (solanaGems && solanaGems.length > 0) {
            displayCoins(solanaGems);
        } else {
            coinList.innerHTML = '<div style="text-align:center; padding:20px;">Belum ada koin baru. Tunggu 30 detik.</div>';
        }
    } catch (error) {
        coinList.innerHTML = '<div style="text-align:center; color:red;">Koneksi Gagal. Coba Refresh.</div>';
    }
}

function displayCoins(items) {
    coinList.innerHTML = '<div class="grid" id="grid"></div>';
    const grid = document.getElementById('grid');

    items.slice(0, 15).forEach(item => {
        const ca = item.tokenAddress;
        const card = document.createElement('div');
        card.className = 'card';
        
        // Ambil link sosial jika ada
        const xLink = item.links?.find(l => l.type === 'twitter')?.url;
        const tgLink = item.links?.find(l => l.type === 'telegram')?.url;

        card.innerHTML = `
            <div class="badge-trend" style="background:#9945FF">NEW LISTING</div>
            <p style="font-size: 0.7rem; color: #888; margin: 0;">${item.symbol} / SOL</p>
            <h3 class="name" style="margin:5px 0; color:white; font-size:1rem;">${item.symbol}</h3>
            
            <div id="sec-${ca}" style="margin-top:10px; padding:8px; background:#1a1a1a; border-radius:8px; font-size:0.75rem;">
                🛡️ Mengecek Authority...
            </div>

            <div class="ca-box" onclick="navigator.clipboard.writeText('${ca}'); alert('CA Copied!')" style="background:#1a1a1a; padding:8px; border-radius:6px; font-size:0.7rem; margin:10px 0; word-break:break-all; border:1px dashed #333; color:#14f195; cursor:pointer;">
                ${ca}
            </div>

            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 5px; margin-top:10px;">
                <button class="btn-action" style="background:#00f2ff; color:black; font-weight:bold; padding:8px; border:none; border-radius:5px;" onclick="window.open('https://gmgn.ai/sol/token/${ca}', '_blank')">📱 GMGN</button>
                <button class="btn-action" style="background:#ff9900; color:black; font-weight:bold; padding:8px; border:none; border-radius:5px;" onclick="window.open('https://jup.ag/swap/SOL-${ca}', '_blank')">🪐 Jup</button>
                <button class="btn-action" style="background:#444; color:white; font-weight:bold; padding:8px; border:none; border-radius:5px;" onclick="window.open('https://rugcheck.xyz/tokens/${ca}', '_blank')">🛡️ Rug</button>
                <button class="btn-action" style="background:#222; color:white; font-weight:bold; padding:8px; border:none; border-radius:5px;" onclick="window.open('${item.url}', '_blank')">📈 Chart</button>
            </div>
            
            <div style="display:flex; gap:10px; margin-top:10px; justify-content:center;">
                ${xLink ? `<a href="${xLink}" target="_blank" style="color:#1da1f2; text-decoration:none; font-size:0.8rem;">[Twitter/X]</a>` : ''}
                ${tgLink ? `<a href="${tgLink}" target="_blank" style="color:#0088cc; text-decoration:none; font-size:0.8rem;">[Telegram]</a>` : ''}
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

        secDiv.innerHTML = `
            <div style="display:flex; justify-content:space-between;">
                <span>Mint: ${isMint ? '⚠️' : '✅'}</span>
                <span>Freeze: ${isFreeze ? '⚠️' : '✅'}</span>
            </div>
        `;
    } catch (e) { secDiv.innerHTML = "Security: N/A"; }
}

fetchNewCoins();
setInterval(fetchNewCoins, 30000);
refreshBtn.addEventListener('click', fetchNewCoins);