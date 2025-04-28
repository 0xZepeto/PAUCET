const AntiCaptcha = require('anticaptcha');
require('dotenv').config();

const solveCaptcha = async (siteKey, pageUrl) => {
  const client = new AntiCaptcha(process.env.ANTICAPTCHA_KEY);
  const captcha = await client.solveHCaptchaProxyless(pageUrl, siteKey);
  return captcha.solution.gRecaptchaResponse; // Token hCaptcha
};

module.exports = { solveCaptcha };
