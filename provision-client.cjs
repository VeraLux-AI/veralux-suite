const path = require("path");
const fs = require("fs");
const { execSync } = require("child_process");
const axios = require("axios");

require("dotenv").config({ path: path.resolve(__dirname, ".env") });

(async () => {


// === CONFIG ===
const TEMPLATE_DIR = './solomon-template';
const OUTPUT_BASE = './provisioned';
const GITHUB_ORG = 'VeraLux-AI'; // or your username/org
const TEMPLATE_REPO_NAME = 'solomon-{{COMPANY_ID}}'; // becomes solomon-brightbuild
const { Octokit } = await import("@octokit/rest");
const octokit = new Octokit({ auth: process.env.GITHUB_TOKEN });


// === ARG PARSER ===
const args = require('minimist')(process.argv.slice(2));
const company = args.name;
const primary = args.color || '#1A73E8';
const accent = args.accent || '#174EA6';
const driveId = args.drive || 'REPLACE_THIS_ID';

if (!company) {
  console.error("❌ Must provide --name");
  process.exit(1);
}

const id = company.toLowerCase().replace(/\s+/g, '-');
// === CREATE COMPANY via Admin Backend ===
const fetch = require('node-fetch');

const createRes = await fetch('http://localhost:3000/admin/create-company', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ company: id })
});
const createResult = await createRes.json();

if (!createResult.success) {
  console.error(`❌ Failed to create company: ${createResult.error}`);
  process.exit(1);
}

const apiKey = createResult.apiKey;
console.log(`🔐 API Key for ${id}: ${apiKey}`);

const capId = id.charAt(0).toUpperCase() + id.slice(1);
const repoName = `veralux-${id}`;
const targetDir = path.join(OUTPUT_BASE, repoName);

fs.mkdirSync(OUTPUT_BASE, { recursive: true }); // ✅ Ensures 'provisioned/' exists


// === COPY TEMPLATE ===

fs.cpSync(TEMPLATE_DIR, targetDir, { recursive: true });
console.log(`📁 Creating ${targetDir} from template...`);


// === PATCH render.yaml ===
const yamlPath = path.join(targetDir, 'render.yaml');
if (fs.existsSync(yamlPath)) {
  let yamlText = fs.readFileSync(yamlPath, 'utf8'); // ✅ Step 1: Read file

  // ✅ Step 2: Replace placeholders
  yamlText = yamlText
    .replace(/veralux-deployment/g, `veralux-${id}`)
    .replace(/brightbuild-template/g, id)
    .replace(/value: REPLACE_THIS/g, (match, offset, str) => {
      if (str.includes("CONFIG_API_KEY")) {
        return `value: ${apiKey}`;
      }
      if (str.includes("GDRIVE_FOLDER_ID")) {
        return `value: ${process.env.GDRIVE_FOLDER_ID}`;
      }
      return match;
    });

  fs.writeFileSync(yamlPath, yamlText); // ✅ Step 3: Write back patched YAML
  console.log(`✅ Patched render.yaml for deployment: ${yamlPath}`);
} else {
  console.warn(`⚠️ No render.yaml found in template to patch.`);
}


// === APPLY REPLACEMENTS ===
function replaceInFile(filePath) {
  let text = fs.readFileSync(filePath, 'utf8');
}

function walk(dir) {
  fs.readdirSync(dir).forEach(file => {
    const full = path.join(dir, file);
    if (fs.lstatSync(full).isDirectory()) {
      walk(full);
    } else if (file.endsWith('.js') || file.endsWith('.env') || file.endsWith('.json') || file.endsWith('.css')) {
      replaceInFile(full);
    }
  });
}

walk(targetDir);

// === GIT + GITHUB LOGIC (OPTIONAL) ===
console.log(`🚀 Initialized: ${repoName}`);

// === AUTOMATED GITHUB PUSH ===
console.log(`🔧 Attempting to create GitHub repo for: ${repoName}`);
try {
  await octokit.repos.createInOrg({
    org: GITHUB_ORG,
    name: repoName,
    private: true
  });
  console.log(`📡 Created GitHub repo: ${GITHUB_ORG}/${repoName}`);

  const remoteUrl = `https://${process.env.GITHUB_TOKEN}@github.com/${GITHUB_ORG}/${repoName}.git`;

  execSync(`git init`, { cwd: targetDir });
  execSync(`git branch -M main`, { cwd: targetDir });
  execSync(`git remote add origin ${remoteUrl}`, { cwd: targetDir });
  execSync(`git add .`, { cwd: targetDir });
  execSync(`git config user.name "VeraLux AutoBot"`, { cwd: targetDir });
  execSync(`git config user.email "nick@veralux.ai"`, { cwd: targetDir });
  execSync(`git commit -m "Initial commit for ${repoName}"`, { cwd: targetDir });
  execSync(`git push -u origin main`, { cwd: targetDir });

  console.log(`✅ Repo pushed to GitHub: ${GITHUB_ORG}/${repoName}`);
} catch (err) {
  console.error("❌ GitHub push failed:", err.message);
}

// === RENDER DEPLOYMENT ===
const envVarsObject = {
  DEPLOYMENT_ID: id,
  CONFIG_API_KEY: apiKey,
  CONFIG_ENDPOINT: 'https://portal.veralux.ai/api/configs',
  USE_REMOTE_CONFIG: 'true',
  GDRIVE_FOLDER_ID: process.env.GDRIVE_FOLDER_ID 
};

const repoUrl = `https://github.com/${GITHUB_ORG}/${repoName}`;

console.log("🌐 Creating Render Web Service...");
try {
  const { serviceId, url } = await createRenderService(id, repoUrl, envVarsObject, process.env.RENDER_OWNER_ID);

  const renderInfoPath = path.join(targetDir, 'render.json');
  fs.writeFileSync(renderInfoPath, JSON.stringify({ serviceId, url }, null, 2));
  console.log(`🌍 Render deployed: ${url}`);

  // === Update deployments.json ===
  const deploymentsPath = path.join(__dirname, 'deployments.json');
  let deployments = {};

  if (fs.existsSync(deploymentsPath)) {
    deployments = JSON.parse(fs.readFileSync(deploymentsPath, 'utf8'));
  }

  deployments[`solomon-${id}`] = {
    renderUrl: url,
    serviceId: serviceId,
    githubRepo: `https://github.com/${GITHUB_ORG}/${repoName}`
  };

  fs.writeFileSync(deploymentsPath, JSON.stringify(deployments, null, 2));
  console.log(`🗂 Saved to deployments.json`);
} catch (err) {
  console.error("❌ Render deployment failed:", err.message);
}

// === WRITE .env TO DEPLOYMENT ===
const envPath = path.join(targetDir, '.env');
  if (!process.env.GDRIVE_FOLDER_ID) {
  throw new Error("❌ GDRIVE_FOLDER_ID is missing from your .env file. Please set it before deploying.");
}

const envVars = [
  `DEPLOYMENT_ID=${id}`,
  `CONFIG_API_KEY=${apiKey}`,
  `CONFIG_ENDPOINT=https://portal.veralux.ai/api/configs`,
  `USE_REMOTE_CONFIG=true`,
  `GDRIVE_FOLDER_ID=${process.env.GDRIVE_FOLDER_ID}`

  // `STRIPE_SECRET_KEY=${process.env.STRIPE_SECRET_KEY || 'REPLACE_THIS'}` // optional
];

fs.writeFileSync(envPath, envVars.join('\n'));
console.log(`📦 .env written to ${envPath}`);

async function createRenderService(company, repoUrl, envVars) {
  const RENDER_API_KEY = process.env.RENDER_API_KEY;
  if (!RENDER_API_KEY) {
    throw new Error("❌ Missing RENDER_API_KEY in .env");
  }

  const ownerId = process.env.RENDER_OWNER_ID;
if (!ownerId) {
  throw new Error("❌ Missing RENDER_OWNER_ID in .env");
}

if (!repoUrl) {
  throw new Error("❌ repoUrl is undefined — cannot deploy to Render.");
}

  
if (!process.env.RENDER_ENV_GROUP_ID) {
  throw new Error("❌ Missing RENDER_ENV_GROUP_ID in .env");
}

const payload = {
  name: `veralux-${company}`,
  type: "web_service",
  runtime: "node",
  region: "oregon",
  ownerId, // from env

  repo: {
    url: repoUrl,
    branch: "main",
    autoDeploy: true
  },

  buildCommand: "npm install",
  startCommand: "node server.js",

  envVars: [
    { key: "DEPLOYMENT_ID", value: id },
    { key: "CONFIG_API_KEY", value: apiKey },
    { key: "CONFIG_ENDPOINT", value: "https://portal.veralux.ai/api/configs" },
    { key: "USE_REMOTE_CONFIG", value: "true" },
    { key: "GDRIVE_FOLDER_ID", value: process.env.GDRIVE_FOLDER_ID }
  ]
};



 console.log("📦 Final Payload:\n", JSON.stringify(payload, null, 2));

try {
  const res = await axios.post("https://api.render.com/v1/services", payload, {
    headers: {
      Authorization: `Bearer ${process.env.RENDER_API_KEY}`,
      "Content-Type": "application/json"
    }
  });

  console.log("✅ Render service created:", res.data);

  return {
    serviceId: res.data.id,
    serviceName: res.data.name,
    url: res.data.serviceDetails?.url || null
  };
} catch (err) {
  console.error("❌ Render service creation failed:", err.response?.data || err.message);
  throw err;
}
}

// === Write admin-config.json to provisioned deployment ===
const configPath = path.join(targetDir, "admin", "admin-config.json");
fs.mkdirSync(path.dirname(configPath), { recursive: true });
fs.writeFileSync(configPath, JSON.stringify(
  {
  "intake": {
    "requiredFields": {
      "value": [
        "full_name",
        "email",
        "phone",
        "location",
        "garage_goals",
        "square_footage",
        "must_have_features",
        "preferred_materials",
        "budget",
        "start_date",
        "final_notes"
      ]
    }
  },
  "submission": {
    "photoField": {
      "value": "photo"
    },
    "photoRequired": {
      "enabled": true
    },
    "generatePdfWithoutPhoto": {
      "enabled": true
    },
    "uploadToDrive": {
      "enabled": true
    },
    "emailTarget": {
      "value": "nick@elevatedgarage.com"
    }
  },
  "pdf": {
    "generatePDF": {
      "enabled": true
    },
    "header": {
      "value": "Garage Quote Summary"
    },
    "includeImages": {
      "enabled": true
    },
    "logoPlacement": {
      "value": "top-left"
    },
    "watermark": {
      "value": "/branding/ElevatedGarage/watermark.png"
    },
    "footerText": {
      "value": "Generated by Solomon AI \u2014 Elevated Garage"
    },
    "filenamePrefix": {
      "value": "Garage-Quote-"
    }
  },
  "modules": {
    "MonitorAI": {
      "fallbackEnabled": {
        "enabled": true
      }
    },
    "Stripe": {
      "enabled": false
    },
    "OCR": {
      "enabled": false
    },
    "Analytics": {
      "enabled": true
    }
  },
  "branding": {
    "brandingKey": {
      "value": "ElevatedGarage"
    },
    "logoUrl": {
      "value": "/branding/ElevatedGarage/logo.png"
    },
    "watermarkUrl": {
      "value": "/branding/ElevatedGarage/watermark.png"
    },
    "primaryColor": {
      "value": "#B91B21"
    }
  },
  "ui": {
    "typingIndicator": {
      "enabled": true
    },
    "exitMessage": {
      "value": "Thanks for reaching out to Elevated Garage!"
    },
    "photoPrompt": {
      "value": "\ud83d\udcf8 Upload a garage photo or tap skip to continue."
    },
    "completeMessage": {
      "value": "\u2705 All set! We\u2019ll review your project details shortly."
    }
  },
  "system": {
    "sessionPrefix": {
      "value": "EG-"
    }
  }
}, null, 2));

  })();

