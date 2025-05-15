const express = require('express');
const fs = require('fs');
const path = require('path');
const router = express.Router();

const CONFIG_DIR = path.join(__dirname, '..', 'configs');
const LOG_PATH = path.join(__dirname, '..', 'logs', 'config-access.log');

router.get('/:deploymentId', (req, res) => {
  const deploymentId = req.params.deploymentId;
  const providedKey = req.headers['authorization']?.replace('Bearer ', '');

  const configPath = path.join(CONFIG_DIR, `${deploymentId}.json`);
  const keyPath = path.join(CONFIG_DIR, `${deploymentId}.key`);

  if (!fs.existsSync(configPath) || !fs.existsSync(keyPath)) {
    return res.status(404).json({ error: 'Config not found' });
  }

  const expectedKey = fs.readFileSync(keyPath, 'utf8').trim();
  if (providedKey !== expectedKey) {
    return res.status(403).json({ error: 'Invalid API key' });
  }

  const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));

  const logEntry = {
    deploymentId,
    timestamp: new Date().toISOString(),
    sourceIP: req.ip,
    versionHash: Buffer.from(JSON.stringify(config)).toString('base64').slice(0, 12)
  };

  fs.appendFileSync(LOG_PATH, JSON.stringify(logEntry) + '\n');

  res.json(config);
});

module.exports = router;