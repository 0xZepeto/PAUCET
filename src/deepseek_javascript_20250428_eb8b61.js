const AntiCaptcha = require('anticaptcha');
require('dotenv').config();

module.exports.solveCaptcha = async (siteKey, pageUrl) => {
  const client = new AntiCaptcha(process.env.ANTICAPTCHA_KEY);
  
  try {
    console.log('➡️ Mengirim permintaan ke AntiCaptcha...');
    const task = await client.createTask({
      type: 'HCaptchaTaskProxyless',
      websiteKey: siteKey,
      websiteURL: pageUrl
    });
    
    console.log('➡️ Menunggu solusi captcha...');
    const result = await client.getTaskResult(task.taskId);
    
    if (result.status === 'ready') {
      return result.solution.gRecaptchaResponse;
    } else {
      throw new Error('Gagal menyelesaikan captcha');
    }
  } catch (error) {
    console.error('Captcha error:', error);
    throw new Error(`Captcha failed: ${error.message}`);
  }
};