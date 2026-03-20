const HELIUS_API_KEY = "b9fce816-011e-4502-91e4-f858655d32d3";
const coinList = document.getElementById('coinList');
const refreshBtn = document.getElementById('refreshBtn');

async function fetchNewCoins() {
    coinList.innerHTML = '<div style="text-align:center; padding:50px; color:#14f195;">🔍 Mengekstrak Nama Asli...</div>';
    try {
        const response = await fetch('https://api.dexscreener.com/token-profiles/latest/v1');
        const data = await response.json();
        const solanaGems = data.filter(item => item.chainId === 'solana');
        if (solanaGems && solanaGems.length > 0) {
            displayCoins(solanaGems);
        } else {
            coinList.innerHTML = '<div style="text-align:center; padding:20px;">Data kosong, coba lagi...</div>';
        }
    } catch (error) {
        coinList.innerHTML = '<div style="text-align:center; color:red;">Koneksi Error.</div>';
    }
}

function displayCoins(items) {
    coinList.innerHTML = '<div class="grid" id="grid"></div>';
    const grid = document.getElementById('grid');

    items.slice(0, 15).forEach(item => {
        const ca = item.tokenAddress || "";
        const icon = item.icon || "";
        
        // --- PERBAIKAN LOGIKA NAMA: Ambil bagian terakhir URL yang BUKAN CA ---
        let urlParts = item.url.split('/');
        let nameFromUrl = urlParts[urlParts.length - 1]; 
        
        // Jika nama dari URL masih berupa CA (panjang), kita ambil simbol atau deskripsi singkat
        let finalName = item.symbol || nameFromUrl;
        if (finalName.length > 20) finalName = "NEW GEM";

        const xLink = item.links?.find(l => l.type === 'twitter')?.url || "";
        const tgLink = item.links?.find(l => l.type === 'telegram')?.url || "";

        const card = document.createElement('div');
        card.className = 'card';
        card.innerHTML = `
            <div class="badge-trend" style="background:#9945FF">SOLANA GEMS</div>
            <div style="display:flex; align-items:center; gap:12px; margin-bottom:10px;">
                ${icon ? `<img src="${icon}" style="width:45px; height:45px; border-radius:50%; border:2px solid #14f195;">` : '<div style="width:45px; height:45px; background:#333; border-radius:50%;"></div>'}
                <div>
                    <h3 class="name" style="margin:0; color:white; font-size:1.1rem; text-transform: uppercase;">${finalName}</h3>
                </div>
            </div>
            <div id="sec-${ca}" style="margin-top:10px; padding:8px; background:#1a1a1a; border-radius:8px; font-size:0.75rem; border:1px solid #222;">
                🛡️ Scanning Authority...
            </div>
            <div class="ca-box" onclick="navigator.clipboard.writeText('${ca}'); alert('CA Copied!')" style="background:#050505; padding:10px; border-radius:6px; font-size:0.7rem; margin:10px 0; word-break:break-all; border:1px dashed #444; color:#14f195; cursor:pointer; text-align:center;">
                ${ca}
            </div>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px;">
                <button class="btn-action" style="background:#00f2ff; color:black; font-weight:bold; padding:10px; border:none; border-radius:5px;" onclick="window.open('https://gmgn.ai/sol/token/${ca}', '_blank')">📱 GMGN</button>
                <button class="btn-action" style="background:#ff9900; color:black; font-weight:bold; padding:10px; border:none; border-radius:5px;" onclick="window.open('https://jup.ag/swap/SOL-${ca}', '_blank')">🪐 Jup</button>
                <button class="btn-action" style="background:#444; color:white; font-weight:bold; padding:10px; border:none; border-radius:5px;" onclick="window.open('https://rugcheck.xyz/tokens/${ca}', '_blank')">🛡️ Rug</button>
                <button class="btn-action" style="background:#222; color:white; font-weight:bold; padding:10px; border:none; border-radius:5px;" onclick="window.open('${item.url}', '_blank')">📈 Chart</button>
            </div>
            <div style="display:flex; gap:20px; margin-top:15px; justify-content:center; border-top:1px solid #222; padding-top:12px;">
                ${xLink ? `<a href="${xLink}" target="_blank" style="color:#1da1f2; text-decoration:none; font-size:0.9rem;">X</a>` : ''}
                ${tgLink ? `<a href="${tgLink}" target="_blank" style="color:#0088cc; text-decoration:none; font-size:0.9rem;">TG</a>` : ''}
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
        const d = data[0]?.onChainData || {};
        const isMint = d.mintAuthority === null;
        const isFreeze = d.freezeAuthority === null;
        secDiv.innerHTML = `
            <div style="display:flex; justify-content:space-between;">
                <span style="color:${isMint ? '#14f195' : 'orange'}">${isMint ? '✅ Mint Off' : '⚠️ Mint On'}</span>
                <span style="color:${isFreeze ? '#14f195' : 'orange'}">${isFreeze ? '✅ Freeze Off' : '⚠️ Freeze On'}</span>
            </div>`;
    } catch (e) { secDiv.innerHTML = "Security: Data N/A"; }
}

fetchNewCoins();
setInterval(fetchNewCoins, 30000);
refreshBtn.addEventListener('click', fetchNewCoins);