const coinList = document.getElementById('coinList');
const refreshBtn = document.getElementById('refreshBtn');

async function fetchNewCoins() {
    coinList.innerHTML = '<div style="text-align:center; padding:50px;">Memindai Solana Blockchain...</div>';
    try {
        const response = await fetch('https://api.dexscreener.com/latest/dex/tokens/solana');
        const data = await response.json();
        displayCoins(data.pairs);
    } catch (error) {
        coinList.innerHTML = 'Koneksi API Gagal.';
    }
}

function displayCoins(pairs) {
    coinList.innerHTML = '';
    if (!pairs) return;

    // Filter: Liquidity > $10,000 (Lebih ketat) & Volume 24h > $50,000
    const filtered = pairs.filter(p => 
        p.liquidity && p.liquidity.usd > 10000 && 
        p.volume && p.volume.h24 > 50000
    );

    filtered.slice(0, 20).forEach(pair => {
        const card = document.createElement('div');
        card.className = 'card';
        
        // Logika sederhana mendeteksi "Trending"
        const isTrending = pair.priceChange.h1 > 10 ? '🔥 TRENDING' : '💎 STABLE';

        card.innerHTML = `
            <div class="badge">${isTrending}</div>
            <h3>${pair.baseToken.name} / ${pair.quoteToken.symbol}</h3>
            
            <div class="info-row">
                <span class="label">Price</span>
                <span>$${pair.priceUsd}</span>
            </div>
            
            <div class="info-row">
                <span class="label">Liquidity</span>
                <span>$${pair.liquidity.usd.toLocaleString()}</span>
            </div>

            <div class="info-row">
                <span class="label">Volume 24h</span>
                <span>$${pair.volume.h24.toLocaleString()}</span>
            </div>

            <div class="ca-box">${pair.baseToken.address}</div>

            <a href="${pair.url}" target="_blank" style="text-decoration:none;">
                <button style="width:100%; margin-top:10px; background:white;">Open Chart</button>
            </a>
        `;
        coinList.appendChild(card);
    });
}

refreshBtn.addEventListener('click', fetchNewCoins);
fetchNewCoins();