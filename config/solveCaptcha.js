const AntiCaptcha = require('anticaptcha');
require('dotenv').config();

const solveCaptcha = async (siteKey, pageUrl) => {
  try {
    if (!process.env.ANTICAPTCHA_KEY) {
      throw new Error('ANTICAPTCHA_KEY tidak diatur di .env');
    }

    const client = new AntiCaptcha(process.env.ANTICAPTCHA_KEY);
    console.log(`[${new Date().toISOString()}] Menyelesaikan hCaptcha untuk ${pageUrl}`);
    
    const captcha = await client.solveHCaptchaProxyless(pageUrl, siteKey);
    if (!captcha.solution.gRecaptchaResponse) {
      throw new Error('Gagal mendapatkan token hCaptcha');
    }

    console.log(`[${new Date().toISOString()}] hCaptcha selesai`);
    return captcha.solution.gRecaptchaResponse; // Token hCaptcha
  } catch (error) {
    console.error(`[${new Date().toISOString()}] Error menyelesaikan hCaptcha: ${error.message}`);
    throw error; // Lempar error untuk ditangani oleh caller
  }
};

module.exports = { solveCaptcha };
