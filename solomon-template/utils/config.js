// utils/config.js
const fetch = require('node-fetch');

let remoteSettings = {
  photoRequired: true,
  generatePdfWithoutPhoto: false,
  branding: "default",
  fallbackEnabled: true
};

const CONFIG_URL = process.env.CONFIG_URL || 'https://veralux.ai/configs/elevatedgarage/settings.json';

async function fetchRemoteConfig() {
  try {
    const res = await fetch(CONFIG_URL);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const newConfig = await res.json();

    remoteSettings = {
      ...remoteSettings,
      ...newConfig // Merge new settings
    };

    console.log(`✅ Remote config fetched at ${new Date().toLocaleTimeString()}`);
  } catch (err) {
    console.error(`⚠️ Config fetch failed: ${err.message}`);
  }
}

// Fetch immediately on load
fetchRemoteConfig();

// Fetch again every 15 minutes
setInterval(fetchRemoteConfig, 15 * 60 * 1000); // 15 min

function getConfig() {
  return remoteSettings;
}

module.exports = getConfig;
