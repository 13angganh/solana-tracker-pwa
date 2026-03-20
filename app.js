const coinList = document.getElementById('coinList');
const refreshBtn = document.getElementById('refreshBtn');

async function fetchNewCoins() {
    coinList.innerHTML = '<div style="text-align:center; padding:50px; color: #14f195;">🔍 Memindai Blockchain Solana...</div>';
    
    try {
        // Menggunakan endpoint "latest profiles" agar dapat koin yang benar-benar baru
        const response = await fetch('https://api.dexscreener.com/token-profiles/latest/v1');
        const data = await response.json();
        
        // Kita hanya ambil koin yang dari chain Solana
        const solanaCoins = data.filter(coin => coin.chainId === 'solana');
        
        displayCoins(solanaCoins);
    } catch (error) {
        console.error(error);
        coinList.innerHTML = '<div style="text-align:center; color:red;">Gagal mengambil data. Coba lagi dalam 5 detik.</div>';
    }
}

function displayCoins(coins) {
    coinList.innerHTML = '';
    
    if (!coins || coins.length === 0) {
        coinList.innerHTML = '<div style="text-align:center; padding:20px;">Tidak ada koin baru ditemukan saat ini.</div>';
        return;
    }

    coins.forEach(coin => {
        const card = document.createElement('div');
        card.className = 'card';
        
        card.innerHTML = `
            <div class="badge">NEW TOKEN</div>
            <h3>${coin.symbol || 'Unknown'}</h3>
            <div class="info-row">
                <span class="label">Description</span>
                <span style="font-size: 0.8rem; text-align: right; max-width: 60%;">${coin.description ? coin.description.substring(0, 50) + '...' : 'No desc'}</span>
            </div>
            <div class="ca-box">${coin.tokenAddress}</div>
            <div style="display: flex; gap: 10px; margin-top: 10px;">
                <a href="${coin.url}" target="_blank" style="flex: 1; text-decoration:none;">
                    <button style="width:100%; background:white; color:black; padding: 8px;">Chart</button>
                </a>
                ${coin.links && coin.links[0] ? `<a href="${coin.links[0].url}" target="_blank" style="flex: 1; text-decoration:none;">
                    <button style="width:100%; background:#9945FF; color:white; padding: 8px;">Socials</button>
                </a>` : ''}
            </div>
        `;
        coinList.appendChild(card);
    });
}

refreshBtn.addEventListener('click', fetchNewCoins);
fetchNewCoins();

// Logika Instal PWA tetap di bawah sini
let deferredPrompt;
window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
    document.getElementById('installBtn').style.display = 'block';
});

document.getElementById('installBtn').addEventListener('click', async () => {
    if (deferredPrompt) {
        deferredPrompt.prompt();
        deferredPrompt = null;
        document.getElementById('installBtn').style.display = 'none';
    }
});