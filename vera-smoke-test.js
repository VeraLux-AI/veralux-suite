// vera-smoke-test.js
const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

const CONFIG_DIR = "./configs";
const REQUIRED_CONFIG_KEYS = ["company", "branding", "requiredFields", "chatResponderPrompt"];

console.log("🔍 Starting VeraLux Smoke Test...\n");

try {
  // 1. Verify config files
  const configFiles = fs.readdirSync(CONFIG_DIR).filter(f => f.endsWith(".json"));
  if (configFiles.length === 0) throw new Error("No config files found in /configs");

  configFiles.forEach(file => {
    const fullPath = path.join(CONFIG_DIR, file);
    const json = JSON.parse(fs.readFileSync(fullPath, "utf-8"));
    for (const key of REQUIRED_CONFIG_KEYS) {
      if (!(key in json)) throw new Error(`${file} is missing required key: ${key}`);
    }
    console.log(`✅ ${file} contains all required keys`);
  });

  // 2. Check prompt generator
  const promptGenerator = require("./admin/ai/promptGenerator");
  const prompt = promptGenerator({
    company: "TestCo",
    industry: "Garage Remodeling",
    requiredFields: ["name", "email", "phone"]
  });
  if (!prompt || typeof prompt !== "string" || !prompt.includes("Garage Remodeling")) {
    throw new Error("Prompt generator failed to create a valid prompt");
  }
  console.log("✅ Prompt generator works");

  // 3. Validate configFetcher behavior
  const configFetcher = require("./configFetcher.js");
  const mockReq = { headers: { authorization: "API-KEY" } };
  const mockRes = {
    json: (data) => {
      if (!data.company) throw new Error("configFetcher returned bad data");
      console.log(`✅ configFetcher returned config for: ${data.company}`);
    },
    status: (code) => ({
      json: (data) => {
        throw new Error(`configFetcher error ${code}: ${JSON.stringify(data)}`);
      }
    })
  };
  configFetcher(mockReq, mockRes);

  // 4. Dry-run provision-client.cjs
  console.log("🛠 Running dry-run of provision-client.cjs...");
  execSync("node provision-client.cjs --dry-run", { stdio: "inherit" });

  // 5. Check essential admin files
  ["index.html", "login.html", "config-viewer.html"].forEach(file => {
    const exists = fs.existsSync(`./admin/${file}`);
    if (!exists) throw new Error(`Missing /admin/${file}`);
    console.log(`✅ Found admin/${file}`);
  });

  console.log("\n🎉 VeraLux Suite smoke test passed successfully!");

} catch (err) {
  console.error("\n❌ VeraLux Smoke Test Failed:", err.message || err);
  process.exit(1);
}
