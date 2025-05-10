const express = require('express');
const path = require('path');
const fs = require('fs');
const { exec } = require('child_process');
const axios = require('axios');
const router = express.Router();

const CONFIG_PATH = (company) => path.join(__dirname, company, 'settings.json');

// Load settings.json for selected company
router.get('/:company/settings.json', (req, res) => {
  const configPath = CONFIG_PATH(req.params.company);
  try {
    const config = fs.readFileSync(configPath, 'utf-8');
    res.json(JSON.parse(config));
  } catch (err) {
    res.status(500).json({ error: 'Failed to load settings.' });
  }
});

// Save updated settings.json
router.post('/:company/save-settings', (req, res) => {
  const configPath = CONFIG_PATH(req.params.company);
  try {
    fs.writeFileSync(configPath, JSON.stringify(req.body, null, 2));
    res.sendStatus(200);
  } catch (err) {
    res.status(500).json({ error: 'Failed to save settings.' });
  }
});

// Create new company + default settings.json
router.post('/create-company', (req, res) => {
  const company = req.body.company?.trim().toLowerCase().replace(/\s+/g, '-');
  if (!company) return res.status(400).json({ error: 'Invalid company name.' });

  const dir = path.join(__dirname, company);
  const configPath = CONFIG_PATH(company);

  if (fs.existsSync(configPath)) {
    return res.status(400).json({ error: 'Company already exists.' });
  }

  const defaultSettings = {
    "photoUpload": { "type": "toggle", "label": "Enable Photo Upload", "enabled": true },
    "summaryDownload": { "type": "toggle", "label": "Enable Summary Download", "enabled": true },
    "followUpEmail": { "type": "toggle", "label": "Send Follow-Up Email to Client", "enabled": false },
    "requirePhotoUpload": { "type": "toggle", "label": "Require Photo Upload Before Summary", "enabled": true },
    "enableDriveUpload": { "type": "toggle", "label": "Upload Files to Google Drive", "enabled": true },
    "enablePdfGeneration": { "type": "toggle", "label": "Generate PDF Summaries", "enabled": true },
    "enableStripeCheckout": { "type": "toggle", "label": "Require Stripe Payment for Intake", "enabled": false },
    "requiredFields": {
      "type": "list",
      "label": "Required Intake Fields",
      "value": [
        "full_name", "email", "phone",
        "garage_goals", "square_footage",
        "must_have_features", "budget",
        "start_date", "final_notes"
      ]
    },
    "allowSkipFields": { "type": "toggle", "label": "Allow Users to Skip Optional Fields", "enabled": true },
    "continueChatAfterIntake": { "type": "toggle", "label": "Continue Chat After Intake Completion", "enabled": true },
    "chatResponderPrompt": {
      "type": "textarea",
      "label": "Chat Responder Prompt",
      "value": "You are a helpful AI assistant that guides users through a garage intake process..."
    },
    "intakeExtractorPrompt": {
      "type": "textarea",
      "label": "Intake Extractor Prompt",
      "value": "Extract structured fields from the conversation: name, email, phone, etc..."
    }
  };

  try {
    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(configPath, JSON.stringify(defaultSettings, null, 2));
    res.status(200).json({ success: true });
  } catch (err) {
    console.error("❌ Failed to create company:", err.message);
    res.status(500).json({ error: 'Failed to create company folder or config.' });
  }
});

// Optional: Trigger provisioning of a Solomon instance
router.post('/provision-company', (req, res) => {
  const company = req.body.company?.trim().toLowerCase().replace(/\s+/g, '-');
  if (!company) return res.status(400).json({ error: 'Missing company name.' });

  const command = `node provision-client.js ${company}`;
  exec(command, (error, stdout, stderr) => {
    if (error) return res.status(500).json({ error: error.message });
    if (stderr) console.warn(stderr);
    res.json({ success: true, output: stdout.trim() });
  });
});

// 🧠 Generate AI Prompt (chatResponderPrompt or intakeExtractorPrompt)
const { OpenAI } = require("openai");
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

router.post('/generate-prompt', async (req, res) => {
  const { purpose, business, tone } = req.body;
  if (!purpose || !business) {
    return res.status(400).json({ error: 'Missing fields' });
  }

  try {
    const systemMessage = {
      role: 'system',
      content: `You are an expert AI prompt engineer. Generate a single prompt for a helpful assistant that uses friendly, professional language to guide users through a conversational intake experience. Do NOT generate extraction or technical instructions.`
    };

    const userMessage = {
      role: 'user',
      content: `
Company type: ${business}
AI purpose: ${purpose}
Tone: ${tone || 'Professional and clear'}

Respond with only the prompt text. No JSON, no keys.
`
    };

    const completion = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [systemMessage, userMessage],
      temperature: 0.7
    });

    const raw = completion.choices[0].message.content.trim();

    res.json({
      success: true,
      prompts: {
        chatResponderPrompt: raw
      }
    });

  } catch (err) {
    console.error("❌ Prompt generation error:", err.message);
    res.status(500).json({ error: "Failed to generate prompt" });
  }
});


async function deploySolomonInstance(company) {
  const renderAPI = 'https://api.render.com/v1/services';
  const apiKey = process.env.RENDER_API_KEY;
  const serviceId = process.env.RENDER_SOLOMON_SERVICE_ID; // Add this to your .env

  const response = await axios.post(
    'https://api.render.com/v1/services/srv-cvva0v0dl3ps739foekg/deploys',
    {},
    {
       headers: {
         Authorization: `Bearer ${apiKey}`,
         'Content-Type': 'application/json',
       }
     }
  );


  return response.data;
}

router.post('/deploy-company', async (req, res) => {
  const { company } = req.body;
  try {
    const result = await deploySolomonInstance(company);
    res.status(200).json({ success: true, deployment: result });
  } catch (err) {
    console.error("❌ Render deploy error:", err.message);
    res.status(500).json({ success: false, error: err.message });
  }
});




module.exports = router;

