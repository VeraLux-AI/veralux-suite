const fetch = require('node-fetch');

let remoteSettings = {}; // dynamic, flexible structure

const defaultSettings = {
  intake: {
    photoRequired: true,
    generatePdfWithoutPhoto: false,
    requiredFields: ["full_name", "email", "phone"]
  },
  ui: {
    primaryColor: "#B91B21",
    typingIndicator: true,
    exitMessage: "Thanks for reaching out!"
  },
  branding: {
    logoUrl: "/branding/default/logo.png",
    watermarkUrl: "/branding/default/watermark.png"
  },
  submission: {
    uploadToDrive: true,
    emailTarget: "nick@yourcompany.com"
  },
  system: {
    sessionPrefix: "EG-",
    analyticsEnabled: false
  },
  modules: {
    MonitorAI: {
      fallbackEnabled: true
    },
    OCR: {
      enabled: false,
      languages: ["en"]
    }
  }
};

const CONFIG_URL = process.env.CONFIG_URL || 'https://veralux.ai/configs/elevatedgarage/settings.json';

async function fetchRemoteConfig() {
  try {
    const res = await fetch(CONFIG_URL);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const externalConfig = await res.json();

    // Deep merge: remote settings overwrite defaults
    remoteSettings = deepMerge(defaultSettings, externalConfig);
    console.log(`✅ Remote config loaded: ${new Date().toLocaleTimeString()}`);
  } catch (err) {
    console.error("⚠️ Failed to fetch remote config:", err.message);
  }
}

function deepMerge(target, source) {
  for (const key of Object.keys(source)) {
    if (
      source[key] &&
      typeof source[key] === 'object' &&
      !Array.isArray(source[key])
    ) {
      if (!target[key]) target[key] = {};
      deepMerge(target[key], source[key]);
    } else {
      target[key] = source[key];
    }
  }
  return target;
}

// Load now and on interval
fetchRemoteConfig();
setInterval(fetchRemoteConfig, 15 * 60 * 1000);

function getConfig() {
  return remoteSettings;
}

module.exports = getConfig;

