const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
const { delay } = require('./utils');

puppeteer.use(StealthPlugin());

module.exports.loginTwitter = async (account, proxy) => {
  const proxyParts = proxy ? proxy.split(':') : null;
  
  const browser = await puppeteer.launch({
    headless: true,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      ...(proxy ? [`--proxy-server=${proxyParts[0]}:${proxyParts[1]}`] : [])
    ]
  });

  const page = await browser.newPage();
  
  try {
    // Buka halaman faucet
    await page.goto('https://faucet.0g.ai', { waitUntil: 'networkidle2', timeout: 60000 });
    await delay(3000);

    // Klik tombol Twitter
    await page.waitForSelector('button[data-testid*="twitter"]', { timeout: 10000 });
    await page.click('button[data-testid*="twitter"]');
    await delay(5000);

    // Handle multiple tabs
    const pages = await browser.pages();
    const twitterPage = pages.find(p => p.url().includes('twitter.com'));
    
    // Isi username
    await twitterPage.waitForSelector('input[name="text"]', { timeout: 10000 });
    await twitterPage.type('input[name="text"]', account.username);
    await twitterPage.click('div[role="button"][data-testid*="Login"]');
    await delay(3000);

    // Handle "unusual login" (jika ada)
    if (await twitterPage.$('input[name="text"]')) {
      await twitterPage.type('input[name="text"]', account.email || account.username);
      await twitterPage.click('div[role="button"][data-testid*="Login"]');
      await delay(3000);
    }

    // Isi password
    await twitterPage.waitForSelector('input[name="password"]', { timeout: 10000 });
    await twitterPage.type('input[name="password"]', account.password);
    await twitterPage.click('div[role="button"][data-testid*="Login"]');
    await delay(5000);

    // Tunggu redirect kembali
    await twitterPage.waitForNavigation({ waitUntil: 'networkidle2', timeout: 30000 });

    // Ambil token dari URL
    const url = twitterPage.url();
    const urlParams = new URLSearchParams(url.split('?')[1]);
    const oauthToken = urlParams.get('oauth_token');
    const oauthVerifier = urlParams.get('oauth_verifier');

    if (!oauthToken || !oauthVerifier) {
      throw new Error('Gagal mendapatkan OAuth token');
    }

    return { oauthToken, oauthVerifier };
  } finally {
    await browser.close();
  }
};