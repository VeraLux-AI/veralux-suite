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
const capId = id.charAt(0).toUpperCase() + id.slice(1);
const repoName = `solomon-${id}`;
const targetDir = path.join(OUTPUT_BASE, repoName);

// === COPY TEMPLATE ===
console.log(`📁 Creating ${targetDir} from template...`);
fs.cpSync(TEMPLATE_DIR, targetDir, { recursive: true });

// === APPLY REPLACEMENTS ===
function replaceInFile(filePath) {
  let text = fs.readFileSync(filePath, 'utf8');
  text = text.replaceAll('{{COMPANY_ID}}', id);
  text = text.replaceAll('{{COMPANY_ID_CAPITALIZED}}', capId);
  text = text.replaceAll('{{PRIMARY_COLOR}}', primary);
  text = text.replaceAll('{{ACCENT_COLOR}}', accent);
  text = text.replaceAll('{{GDRIVE_FOLDER_ID}}', driveId);
  text = text.replaceAll('{{VERALUX_HOSTED_KEY}}', 'USE_CENTRAL_AI');
  fs.writeFileSync(filePath, text);
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
console.log(`Next: cd ${targetDir} && git init && git remote add origin git@github.com:${GITHUB_ORG}/${repoName}.git`);

