// configFetcher.js
const fetch = require('node-fetch');
require('dotenv').config();

async function fetchRemoteConfig() {
  const { DEPLOYMENT_ID, CONFIG_API_KEY, CONFIG_ENDPOINT } = process.env;

  if (!DEPLOYMENT_ID || !CONFIG_API_KEY || !CONFIG_ENDPOINT) {
    throw new Error("❌ Missing DEPLOYMENT_ID, CONFIG_API_KEY, or CONFIG_ENDPOINT in .env");
  }

  const url = `${CONFIG_ENDPOINT}/${DEPLOYMENT_ID}`;
  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${CONFIG_API_KEY}`
    }
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`❌ Failed to fetch config for ${DEPLOYMENT_ID}: ${res.status} ${err}`);
  }

  const config = await res.json();
  console.log(`✅ Fetched remote config for ${DEPLOYMENT_ID}`);
  return config;
}

module.exports = fetchRemoteConfig;
