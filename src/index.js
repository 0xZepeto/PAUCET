const fs = require('fs');
const { loginTwitter } = require('./twitter');
const { claimFaucet } = require('./faucet');
const { delay } = require('./utils');

// Config files
const ACCOUNTS = JSON.parse(fs.readFileSync('./accounts.json'));
const PROXIES = fs.readFileSync('./proxies.txt', 'utf-8').split('\n').filter(p => p.trim());
const WALLET_ADDRESS = fs.readFileSync('./address.txt', 'utf-8').trim();

// Load claimed history
let claimedAccounts = {};
if (fs.existsSync('./claimed.json')) {
  claimedAccounts = JSON.parse(fs.readFileSync('./claimed.json'));
}

async function main() {
  console.log(`Memulai proses claim untuk ${ACCOUNTS.length} akun...`);

  for (let i = 0; i < ACCOUNTS.length; i++) {
    const account = ACCOUNTS[i];
    const proxy = PROXIES[i] || null;
    const today = new Date().toISOString().split('T')[0];

    // Skip jika sudah claim hari ini
    if (claimedAccounts[account.username] === today) {
      console.log(`[${i+1}/${ACCOUNTS.length}] ${account.username} sudah claim hari ini. Skip...`);
      continue;
    }

    console.log(`\n[${i+1}/${ACCOUNTS.length}] Memproses ${account.username}...`);

    try {
      // 1. Login Twitter
      console.log('➡️ Login ke Twitter...');
      const { oauthToken, oauthVerifier } = await loginTwitter(account, proxy);
      
      // 2. Claim Faucet
      console.log('➡️ Claiming faucet...');
      const result = await claimFaucet(oauthToken, oauthVerifier, WALLET_ADDRESS, proxy);
      
      // 3. Tandai sebagai sudah claim
      claimedAccounts[account.username] = today;
      fs.writeFileSync('./claimed.json', JSON.stringify(claimedAccounts, null, 2));
      
      console.log(`✅ Berhasil! Tx: ${result.txHash || 'N/A'}`);
    } catch (error) {
      console.error(`❌ Gagal: ${error.message}`);
      
      // Jika error karena sudah claim, tetap tandai
      if (error.message.includes('sudah digunakan')) {
        claimedAccounts[account.username] = today;
        fs.writeFileSync('./claimed.json', JSON.stringify(claimedAccounts, null, 2));
      }
    }

    // Delay antar akun
    if (i < ACCOUNTS.length - 1) {
      const delayTime = Math.floor(Math.random() * 10000) + 5000;
      console.log(`🕒 Menunggu ${delayTime/1000} detik...`);
      await delay(delayTime);
    }
  }

  console.log('\n✅ Semua akun telah diproses!');
}

main().catch(console.error);
