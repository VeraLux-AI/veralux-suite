const path = require('path');
const fs = require('fs');
const express = require('express');
const router = express.Router();

const adminConfigPath = path.join(__dirname, 'admin-config.json');
const usageStats = {}; // In-memory usage tracking (example only)

router.get('/client-dashboard/:companyId', (req, res) => {
  res.sendFile(path.join(__dirname, 'client-dashboard.html'));
});

router.get('/client-stats/:companyId', (req, res) => {
  const { companyId } = req.params;
  const stats = usageStats[companyId] || {
    submissions: 0,
    photoUploads: 0,
    summariesGenerated: 0,
    fallbackEnabled: false,
  };
  res.json(stats);
});

// Example update endpoint — integrate where appropriate
function logClientActivity(companyId, type) {
  if (!usageStats[companyId]) {
    usageStats[companyId] = {
      submissions: 0,
      photoUploads: 0,
      summariesGenerated: 0,
      fallbackEnabled: false,
    };
  }
  if (type === 'submit') usageStats[companyId].submissions++;
  if (type === 'photo') usageStats[companyId].photoUploads++;
  if (type === 'summary') usageStats[companyId].summariesGenerated++;
}

const { exec } = require('child_process');

router.post('/provision-company', (req, res) => {
  const company = req.body.company?.trim().toLowerCase();
  if (!company) return res.status(400).json({ error: "Missing company name" });

  const command = `node provision-client.js --name ${company}`;

  console.log(`🚀 Starting provisioning for ${company}...`);
  exec(command, { cwd: path.join(__dirname, '..') }, (err, stdout, stderr) => {
    if (err) {
      console.error(`❌ Provisioning failed: ${stderr}`);
      return res.status(500).json({ success: false, error: stderr });
    }

    console.log(`✅ Provisioning complete:\n${stdout}`);
    res.status(200).json({ success: true, message: `Provisioned ${company}` });
  });
});


module.exports = { router, logClientActivity };
