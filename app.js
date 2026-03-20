const HELIUS_API_KEY = "b9fce816-011e-4502-91e4-f858655d32d3";
const coinList = document.getElementById('coinList');
const refreshBtn = document.getElementById('refreshBtn');

async function checkSecurity(mint) {
    if (!HELIUS_API_KEY || HELIUS_API_KEY === "b9fce816-011e-4502-91e4-f858655d32d3") return null;
    try {
        const response = await fetch(`https://api.helius.xyz/v0/token-metadata?api-key=${HELIUS_API_KEY}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ mintAccounts: [mint] }),
        });
        const data = await response.json();
        return data[0]?.offChainData || null;
    } catch (e) { return null; }
}

async function fetchNewCoins() {
    coinList.innerHTML = '<div style="text-align:center; padding:50px; color:#14f195;">🔍 Memindai Blockchain Solana via Jalur Prioritas...</div>';
    
    // Trik "Pintu Belakang" (Proxy) agar data DexScreener tidak null
    const proxyUrl = "https://corsproxy.io/?"; 
    const apiUrl = "https://api.dexscreener.com/latest/dex/tokens/solana";

    try {
        const response = await fetch(proxyUrl + apiUrl);
        const data = await response.json();
        
        console.log("Data diterima:", data);

        if (data.pairs && data.pairs.length > 0) {
            // Urutkan Volume 24 jam tertinggi
            const sorted = data.pairs.sort((a, b) => (b.volume?.h24 || 0) - (a.volume?.h24 || 0));
            displayCoins(sorted);
        } else {
            coinList.innerHTML = '<div style="text-align:center; padding:20px;">DexScreener sedang sibuk. Coba manual dengan tombol Refresh.</div>';
        }
    } catch (error) {
        console.error("Fetch Error:", error);
        coinList.innerHTML = '<div style="text-align:center; color:red;">Koneksi API Gagal. Coba lagi sebentar.</div>';
    }
}

async function displayCoins(pairs) {
    coinList.innerHTML = '<div class="grid" id="grid"></div>';
    const grid = document.getElementById('grid');

    // Kita ambil 12 data teratas agar loading cepat
    for (const pair of pairs.slice(0, 12)) {
        const ca = pair.baseToken.address;
        const liq = pair.liquidity?.usd || 0;
        const vol = pair.volume?.h24 || 0;
        const vlRatio = liq > 0 ? (vol / liq).toFixed(2) : 0;
        const h1Change = pair.priceChange?.h1 || 0;

        // Ambil data keamanan Helius di balik layar
        checkSecurity(ca).then(meta => {
            const hasLinks = meta && (meta.twitter || meta.website || meta.telegram);
            
            // Cari elemen kartu yang sudah dibuat
            const cardEl = document.getElementById(`card-${ca}`);
            if (cardEl) {
                const securityContainer = cardEl.querySelector('.security-info');
                
                let securityHTML = `
                    <p style="font-size:0.75rem; margin:5px 0;">
                        ${isMintDisabled(meta) ? '🟢 Mint Disabled' : '⚠️ Mint Enabled'} / 
                        ${isFreezeDisabled(meta) ? '🟢 Freeze Disabled' : '⚠️ Freeze Enabled'}
                    </p>
                `;

                if (hasLinks) {
                    securityHTML += `
                        <div style="display:flex; gap:10px; margin-top:5px; border-top:1px solid #333; padding-top:5px;">
                            ${meta.twitter ? `<a href="${meta.twitter}" target="_blank" style="text-decoration:none;">📱 X</a>` : ''}
                            ${meta.telegram ? `<a href="${meta.telegram}" target="_blank" style="text-decoration:none;">📣 TG</a>` : ''}
                            ${meta.website ? `<a href="${meta.website}" target="_blank" style="text-decoration:none;">🌐 Web</a>` : ''}
                        </div>
                    `;
                } else {
                    securityHTML += '<p style="font-size:0.7rem; color:#888;">No social links</p>';
                }
                securityContainer.innerHTML = securityHTML;
            }
        });

        const card = document.createElement('div');
        card.className = 'card';
        card.id = `card-${ca}`;
        
        card.innerHTML = `
            <div class="badge-trend" style="background:${h1Change >= 0 ? 'var(--sol-purple)' : '#444'}">
                ${h1Change >= 0 ? '🔥 ' + h1Change + '%' : '📉 ' + h1Change + '%'}
            </div>
            
            <p style="font-size: 0.7rem; color: #888; margin: 0;">${pair.baseToken.symbol} / SOL</p>
            <h3 class="name" style="margin:5px 0; color:white;">${pair.baseToken.name}</h3>
            
            <div class="price" style="color:#14f195; font-size:1.2rem; font-weight:bold;">$${parseFloat(pair.priceUsd).toFixed(8)}</div>
            
            <div style="font-size: 0.8rem; margin: 10px 0; display:flex; justify-content:space-between; color:#aaa;">
                <span>Liq: $${Math.round(liq).toLocaleString()}</span>
                <span style="color:${vlRatio > 10 ? 'red' : '#aaa'}">V/L: ${vlRatio}</span>
            </div>

            <div class="security-info" style="margin-top:10px; padding:8px; background:#1a1a1a; border-radius:8px; min-height:30px; font-size:0.8rem;">
                Memuat data keamanan Helius...
            </div>

            <div class="ca-box" style="background:#1a1a1a; padding:8px; border-radius:6px; font-size:0.7rem; margin:10px 0; word-break:break-all; border:1px dashed #333; color:#14f195; cursor:pointer;" onclick="navigator.clipboard.writeText('${ca}'); alert('CA Copied!')">
                ${ca}
            </div>

            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 5px; margin-top:10px;">
                <button class="btn-action" style="background:#00f2ff; color:black; padding:8px; border:none; border-radius:5px; font-weight:bold; cursor:pointer;" onclick="window.open('https://gmgn.ai/sol/token/${ca}', '_blank')">📱 GMGN</button>
                <button class="btn-action" style="background:#ff9900; color:black; padding:8px; border:none; border-radius:5px; font-weight:bold; cursor:pointer;" onclick="window.open('https://jup.ag/swap/SOL-${ca}', '_blank')">🪐 Jupiter</button>
                <button class="btn-action" style="background:#444; color:white; padding:8px; border:none; border-radius:5px; font-weight:bold; cursor:pointer;" onclick="window.open('https://rugcheck.xyz/tokens/${ca}', '_blank')">🛡️ RugCheck</button>
                <button class="btn-action" style="background:#222; color:white; padding:8px; border:none; border-radius:5px; font-weight:bold; cursor:pointer;" onclick="window.open('${pair.url}', '_blank')">📈 Chart</button>
            </div>
        `;
        grid.appendChild(card);
    }
}

// Logika pembantu untuk Helius
function isMintDisabled(meta) { return meta && meta.mintAuthority === null; }
function isFreezeDisabled(meta) { return meta && meta.freezeAuthority === null; }

// Jalankan pencarian pertama
fetchNewCoins();
setInterval(fetchNewCoins, 30000);
refreshBtn.addEventListener('click', fetchNewCoins);