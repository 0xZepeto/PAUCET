const { loadAccounts, loadAddress, loadProxies, loadTokens, log } = require('./utils');
const { claimFaucet } = require('./config/faucet');
const fs = require('fs');
const path = require('path');

// File untuk melacak akun yang sudah claim
const claimedAccountsFile = path.join(__dirname, 'claimed_accounts.json');

const loadClaimedAccounts = () => {
  if (fs.existsSync(claimedAccountsFile)) {
    return JSON.parse(fs.readFileSync(claimedAccountsFile, 'utf-8'));
  }
  return {};
};

const saveClaimedAccounts = (claimedAccounts) => {
  fs.writeFileSync(claimedAccountsFile, JSON.stringify(claimedAccounts, null, 2));
};

const main = async () => {
  try {
    // Muat konfigurasi
    const accounts = loadAccounts();
    const tokens = loadTokens();
    const walletAddress = loadAddress();
    let proxies = loadProxies();

    // Periksa apakah jumlah akun dan token sama
    if (accounts.length !== tokens.length) {
      log(`Peringatan: Jumlah username (${accounts.length}) tidak sama dengan jumlah token (${tokens.length}). Hanya memproses hingga jumlah yang lebih kecil.`);
    }

    // Muat daftar akun yang sudah claim
    const claimedAccounts = loadClaimedAccounts();
    const today = new Date().toISOString().split('T')[0]; // Tanggal hari ini

    // Jika tidak ada proxy, beri tahu pengguna
    if (!proxies || proxies.length === 0) {
      log('Tidak ada proxy yang ditemukan. 1 IP hanya bisa claim 1x sehari.');
      proxies = [null]; // Tanpa proxy
    }

    // Iterasi melalui proxy
    for (const proxy of proxies) {
      // Iterasi melalui akun, batasi hingga jumlah token yang tersedia
      for (let i = 0; i < Math.min(accounts.length, tokens.length); i++) {
        const account = accounts[i];
        const token = tokens[i];
        const username = account.username;

        // Periksa apakah akun sudah claim hari ini
        if (claimedAccounts[username] === today) {
          log(`Akun ${username} sudah claim hari ini. Lewati.`);
          continue;
        }

        log(`Memproses akun: ${username}`);

        // Claim faucet
        try {
          const result = await claimFaucet(token.oauthToken, token.oauthVerifier, walletAddress, proxy);
          log(`Claim berhasil untuk ${username}: ${JSON.stringify(result)}`);

          // Tandai akun sebagai sudah claim
          claimedAccounts[username] = today;
          saveClaimedAccounts(claimedAccounts);
        } catch (error) {
          log(`Error untuk ${username}: ${error.message}`);
          if (error.message.includes('IP atau akun Twitter sudah digunakan')) {
            claimedAccounts[username] = today;
            saveClaimedAccounts(claimedAccounts);
          }
        }

        // Jika tanpa proxy, hentikan setelah 1 claim karena batasan IP
        if (!proxy) break;
      }
      // Jika menggunakan proxy, lanjutkan ke proxy berikutnya
      if (!proxy) break;
    }
  } catch (error) {
    log(`Error utama: ${error.message}`);
  }
};

main();
