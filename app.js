const HELIUS_API_KEY = "b9fce816-011e-4502-91e4-f858655d32d3";
const coinList = document.getElementById('coinList');
const refreshBtn = document.getElementById('refreshBtn');

async function fetchNewCoins() {
    coinList.innerHTML = '<div style="text-align:center; padding:50px; color:#14f195;">🔍 Mencari Koin Solana Asli...</div>';
    
    try {
        const response = await fetch('https://api.dexscreener.com/token-profiles/latest/v1');
        const data = await response.json();
        
        // Filter hanya koin Solana
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
        // PERBAIKAN: Menggunakan properti yang benar agar tidak undefined
        const ca = item.tokenAddress || "";
        const symbol = item.symbol || "TOKEN";
        const icon = item.icon || "";
        const xLink = item.links?.find(l => l.type === 'twitter')?.url || "";
        const tgLink = item.links?.find(l => l.type === 'telegram')?.url || "";

        const card = document.createElement('div');
        card.className = 'card';
        
        card.innerHTML = `
            <div class="badge-trend" style="background:#9945FF">NEW PROFILE</div>
            <div style="display:flex; align-items:center; gap:10px; margin-bottom:10px;">
                ${icon ? `<img src="${icon}" style="width:30px; height:30px; border-radius:50%;">` : ''}
                <h3 class="name" style="margin:0; color:white; font-size:1.1rem;">${symbol}</h3>
            </div>
            
            <div id="sec-${ca}" style="margin-top:10px; padding:8px; background:#1a1a1a; border-radius:8px; font-size:0.75rem; color:#aaa;">
                🛡️ Authority: Checking...
            </div>

            <div class="ca-box" onclick="navigator.clipboard.writeText('${ca}'); alert('CA Copied!')" style="background:#1a1a1a; padding:8px; border-radius:6px; font-size:0.7rem; margin:10px 0; word-break:break-all; border:1px dashed #333; color:#14f195; cursor:pointer; text-align:center;">
                ${ca}
            </div>

            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 5px; margin-top:10px;">
                <button class="btn-action" style="background:#00f2ff; color:black; font-weight:bold; padding:8px; border:none; border-radius:5px; cursor:pointer;" onclick="window.open('https://gmgn.ai/sol/token/${ca}', '_blank')">📱 GMGN</button>
                <button class="btn-action" style="background:#ff9900; color:black; font-weight:bold; padding:8px; border:none; border-radius:5px; cursor:pointer;" onclick="window.open('https://jup.ag/swap/SOL-${ca}', '_blank')">🪐 Jup</button>
                <button class="btn-action" style="background:#444; color:white; font-weight:bold; padding:8px; border:none; border-radius:5px; cursor:pointer;" onclick="window.open('https://rugcheck.xyz/tokens/${ca}', '_blank')">🛡️ Rug</button>
                <button class="btn-action" style="background:#222; color:white; font-weight:bold; padding:8px; border:none; border-radius:5px; cursor:pointer;" onclick="window.open('${item.url}', '_blank')">📈 Chart</button>
            </div>
            
            <div style="display:flex; gap:15px; margin-top:12px; justify-content:center; border-top:1px solid #222; padding-top:10px;">
                ${xLink ? `<a href="${xLink}" target="_blank" style="color:#1da1f2; text-decoration:none; font-size:0.85rem; font-weight:bold;">X / Twitter</a>` : ''}
                ${tgLink ? `<a href="${tgLink}" target="_blank" style="color:#0088cc; text-decoration:none; font-size:0.85rem; font-weight:bold;">Telegram</a>` : ''}
            </div>
        `;
        grid.appendChild(card);
        if(ca) fetchSecurity(ca);
    });
}

async function fetchSecurity(mint) {
    const secDiv = document.getElementById(`sec-${mint}`);
    if(!mint) return;
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
                <span style="color:#14f195;">Verified</span>
            </div>
        `;
    } catch (e) { secDiv.innerHTML = "Security: Data N/A"; }
}

fetchNewCoins();
setInterval(fetchNewCoins, 30000);
refreshBtn.addEventListener('click', fetchNewCoins);