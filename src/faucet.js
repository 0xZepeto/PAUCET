const axios = require('axios');
const { solveCaptcha } = require('./solveCaptcha');

const claimFaucet = async (authToken, oauthVerifier, walletAddress, proxy) => {
  const faucetUrl = 'https://faucet.0g.ai';
  const claimEndpoint = `${faucetUrl}/api/faucet`;

  // Selesaikan captcha
  const siteKey = '914e63b4-ac20-4c24-bc92-cdb6950ccfde';
  const captchaToken = await solveCaptcha(siteKey, faucetUrl);

  // Konfigurasi proxy (jika ada)
  let proxyConfig = false;
  if (proxy) {
    const [protocol, hostPort] = proxy.split('://');
    const [host, port] = hostPort ? hostPort.split(':') : proxy.split(':');
    proxyConfig = {
      protocol: protocol || 'http',
      host,
      port: parseInt(port),
    };
  }

  // Kirim permintaan claim
  try {
    const response = await axios.post(
      claimEndpoint,
      {
        address: walletAddress,
        hcaptchaToken: captchaToken,
        oauth_token: authToken,
        oauth_verifier: oauthVerifier,
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'Origin': 'https://faucet.0g.ai',
          'Referer': `https://faucet.0g.ai/?oauth_token=${authToken}&oauth_verifier=${oauthVerifier}`,
        },
        proxy: proxyConfig,
      }
    );
    return response.data;
  } catch (error) {
    if (error.response?.status === 500) {
      throw new Error('Gagal claim: Kemungkinan IP atau akun Twitter sudah digunakan untuk claim hari ini.');
    }
    throw new Error(`Gagal claim: ${error.response?.data || error.message}`);
  }
};

module.exports = { claimFaucet };
