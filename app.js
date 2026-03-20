const coinList = document.getElementById('coinList');
const refreshBtn = document.getElementById('refreshBtn');

async function fetchNewCoins() {
    coinList.innerHTML = 'Mencari koin potensial (LP > $5k)...';
    try {
        const response = await fetch('https://api.dexscreener.com/latest/dex/tokens/solana');
        const data = await response.json();
        displayCoins(data.pairs);
    } catch (error) {
        coinList.innerHTML = 'Gagal menarik data API. Coba lagi nanti.';
        console.error(error);
    }
}

function displayCoins(pairs) {
    coinList.innerHTML = '';
    if (!pairs) {
        coinList.innerHTML = 'Tidak ada data ditemukan.';
        return;
    }

    // Filter Keras: Hanya ambil yang likuiditasnya di atas $5.000
    const safePairs = pairs.filter(p => p.liquidity && p.liquidity.usd > 5000);

    safePairs.slice(0, 15).forEach(pair => {
        const card = document.createElement('div');
        card.className = 'card';
        const thesis = `Volume 24h: $${pair.volume.h24.toLocaleString()}. LP aman (> $5k).`;

        card.innerHTML = `
            <h3>${pair.baseToken.name} ($${pair.baseToken.symbol})</h3>
            <p><strong>CA:</strong> <span class="ca">${pair.baseToken.address}</span></p>
            <p><strong>Harga:</strong> $${pair.priceUsd}</p>
            <p><strong>Likuiditas:</strong> $${pair.liquidity.usd.toLocaleString()}</p>
            <p><strong>Tesis Dasar:</strong> ${thesis}</p>
            <a href="${pair.url}" target="_blank"><button style="margin-top:10px; background:#9945FF; color:white;">Lihat Chart</button></a>
        `;
        coinList.appendChild(card);
    });
}

refreshBtn.addEventListener('click', fetchNewCoins);
fetchNewCoins(); // Langsung jalankan saat web dibuka