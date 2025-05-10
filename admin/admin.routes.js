const express = require('express');
const path = require('path');
const fs = require('fs');
const { exec } = require('child_process');

const router = express.Router();

// === Existing Routes (settings loading/saving) ===
const CONFIG_PATH = (company) => path.join(__dirname, `${company}/settings.json`);

router.get('/:company/settings.json', (req, res) => {
  const configPath = CONFIG_PATH(req.params.company);
  try {
    const config = fs.readFileSync(configPath, 'utf-8');
    res.json(JSON.parse(config));
  } catch (err) {
    res.status(500).json({ error: 'Failed to load settings.' });
  }
});

router.post('/:company/save-settings', (req, res) => {
  const configPath = CONFIG_PATH(req.params.company);
  try {
    fs.writeFileSync(configPath, JSON.stringify(req.body, null, 2));
    res.sendStatus(200);
  } catch (err) {
    res.status(500).json({ error: 'Failed to save settings.' });
  }
});

// === NEW: Provision Solomon Instance ===
router.post('/provision-company', (req, res) => {
  const { company } = req.body;
  if (!company || company.trim() === "") {
    return res.status(400).json({ error: "Missing company name." });
  }

  const sanitized = company.trim().toLowerCase().replace(/\s+/g, '-');
  const command = `node provision-client.js ${sanitized}`;

  console.log("⚙️ Provisioning:", sanitized);
  exec(command, (error, stdout, stderr) => {
    if (error) {
      console.error("❌ Provisioning error:", error.message);
      return res.status(500).json({ error: error.message });
    }
    if (stderr) {
      console.warn("⚠️ Provision stderr:", stderr);
    }
    console.log("✅ Provisioned:", stdout.trim());
    res.json({ success: true, output: stdout.trim() });
  });
});

module.exports = router;
