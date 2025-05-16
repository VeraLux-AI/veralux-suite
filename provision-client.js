// provision-client.js
// Usage: node provision-client.js --name brightbuild --color "#1A73E8" --accent "#174EA6"

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// === CONFIG ===
const TEMPLATE_DIR = './solomon-template';
const OUTPUT_BASE = './provisioned';
const GITHUB_ORG = 'VeraLux-AI'; // or your username/org
const TEMPLATE_REPO_NAME = 'solomon-{{COMPANY_ID}}'; // becomes solomon-brightbuild

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
const repoName = `solomon-${id}`;
const targetDir = path.join(OUTPUT_BASE, repoName);

fs.mkdirSync(OUTPUT_BASE, { recursive: true }); // ✅ Ensures 'provisioned/' exists


// === COPY TEMPLATE ===
console.log(`📁 Creating ${targetDir} from template...`);
fs.cpSync(TEMPLATE_DIR, targetDir, { recursive: true });

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
try {
  
  // === 🧠 Auto-create the GitHub repo before pushing
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

// === WRITE .env TO DEPLOYMENT ===
const envPath = path.join(targetDir, '.env');
const envVars = [
  `DEPLOYMENT_ID=${id}`,
  `CONFIG_API_KEY=${apiKey}`,
  `CONFIG_ENDPOINT=https://portal.veralux.ai/api/configs`,
  `USE_REMOTE_CONFIG=true`,
  `GDRIVE_FOLDER_ID=${process.env.GDRIVE_FOLDER_ID || 'REPLACE_THIS'}`
  // `STRIPE_SECRET_KEY=${process.env.STRIPE_SECRET_KEY || 'REPLACE_THIS'}` // optional
];

fs.writeFileSync(envPath, envVars.join('\n'));
console.log(`📦 .env written to ${envPath}`);



console.log(`Next: cd ${targetDir} && git init && git remote add origin git@github.com:${GITHUB_ORG}/${repoName}.git`);


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
