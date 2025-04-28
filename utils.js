const fs = require('fs');
const path = require('path');

const log = (message) => {
  console.log(`[${new Date().toISOString()}] ${message}`);
};

const loadAccounts = () => {
  const accountsPath = path.join(__dirname, 'user.txt');
  const usernames = fs.readFileSync(accountsPath, 'utf-8').trim().split('\n');
  return usernames.map(username => ({ username: username.trim() }));
};

const loadTokens = () => {
  const tokenPath = path.join(__dirname, 'token.txt');
  if (!fs.existsSync(tokenPath)) return [];
  const tokens = fs.readFileSync(tokenPath, 'utf-8').trim().split('\n');
  return tokens.map(line => {
    const [oauthToken, oauthVerifier] = line.split(',');
    return { oauthToken: oauthToken.trim(), oauthVerifier: oauthVerifier.trim() };
  });
};

const loadAddress = () => {
  const addressPath = path.join(__dirname, 'address.txt');
  return fs.readFileSync(addressPath, 'utf-8').trim();
};

const loadProxies = () => {
  const proxyPath = path.join(__dirname, 'proxy.txt');
  if (!fs.existsSync(proxyPath)) return null;
  const proxies = fs.readFileSync(proxyPath, 'utf-8').trim().split('\n');
  return proxies.length > 0 && proxies[0] ? proxies : null;
};

module.exports = { log, loadAccounts, loadTokens, loadAddress, loadProxies };
