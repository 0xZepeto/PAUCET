const axios = require('axios');
const axiosRetry = require('axios-retry');
const { solveCaptcha } = require('./captcha');

// Configure retry
axiosRetry(axios, {
  retries: 3,
  retryDelay: (retryCount) => {
    return retryCount * 2000;
  },
  retryCondition: (error) => {
    return axiosRetry.isNetworkOrIdempotentRequestError(error) || error.response?.status === 429;
  }
});

module.exports.claimFaucet = async (oauthToken, oauthVerifier, walletAddress, proxy) => {
  const proxyConfig = proxy ? {
    protocol: 'http',
    host: proxy.split(':')[0],
    port: parseInt(proxy.split(':')[1]),
    auth: proxy.split(':').length > 2 ? {
      username: proxy.split(':')[2],
      password: proxy.split(':')[3]
    } : undefined
  } : undefined;

  // Solve hCaptcha
  console.log('➡️ Menyelesaikan hCaptcha...');
  const captchaToken = await solveCaptcha(
    '914e63b4-ac20-4c24-bc92-cdb6950ccfde',
    'https://faucet.0g.ai'
  );

  // Claim request
  const response = await axios.post(
    'https://faucet.0g.ai/api/faucet',
    {
      address: walletAddress,
      hcaptchaToken: captchaToken,
      oauth_token: oauthToken,
      oauth_verifier: oauthVerifier
    },
    {
      headers: {
        'Content-Type': 'application/json',
        'Origin': 'https://faucet.0g.ai',
        'Referer': `https://faucet.0g.ai/?oauth_token=${oauthToken}&oauth_verifier=${oauthVerifier}`
      },
      proxy: proxyConfig,
      timeout: 30000
    }
  );

  if (response.data.error) {
    throw new Error(response.data.error);
  }

  return response.data;
};
