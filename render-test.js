const axios = require("axios");
require("dotenv").config();

(async () => {
  const payload = {
    name: "minimal-veralux-test",
    type: "web_service",
    runtime: "node",
    region: "oregon",
    ownerId: process.env.RENDER_OWNER_ID,
    repo: {
      url: "https://github.com/VeraLux-AI/veralux-suite",
      branch: "main",
      autoDeploy: true
    },
    buildCommand: "npm install",
    startCommand: "node server.js",
    envVars: [
      { key: "MY_VAR", value: "test" }
    ]
  };

  console.log("📦 Payload:", JSON.stringify(payload, null, 2));

  try {
    const res = await axios.post("https://api.render.com/v1/services", payload, {
      headers: {
        Authorization: `Bearer ${process.env.RENDER_API_KEY}`,
        "Content-Type": "application/json"
      }
    });

    console.log("✅ Created:", res.data);
  } catch (err) {
    console.error("❌ ERROR:", err.response?.data || err.message);
  }
})();
