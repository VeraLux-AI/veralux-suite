require("dotenv").config();
const { OpenAI } = require("openai");
const fs = require("fs");
const path = require("path");

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

async function getRequiredFields(company) {
  try {
    const configPath = path.join(__dirname, "../admin", company, "settings.json");
    const config = JSON.parse(fs.readFileSync(configPath, "utf-8"));
    return config.requiredFields?.value || [];
  } catch (err) {
    console.error("❌ Failed to load required fields:", err.message);
    return [];
  }
}

async function checkIfDone(sessionData, company = "elevated-garage") {
  const requiredFields = await getRequiredFields(company);
  const missingFields = [];

  for (const field of requiredFields) {
    const value = sessionData[field];
    if (!value || value.trim() === "") {
      missingFields.push(field);
    }
  }

  if (missingFields.length > 0) {
    return { done: false, missing: missingFields };
  }

  const prompt = `You are a validation assistant. Double-check if all required fields for a client intake are present and complete. Return JSON like { done: true } or { done: false, missing: [field1, field2, ...] }.

Session Data: ${JSON.stringify(sessionData, null, 2)}
Required Fields: ${JSON.stringify(requiredFields)}`;

  const response = await openai.chat.completions.create({
    model: "gpt-3.5-turbo",
    messages: [{ role: "user", content: prompt }],
  });

  const content = response.choices[0].message.content.trim();
  try {
    const result = JSON.parse(content);
    return result;
  } catch (err) {
    console.warn("⚠️ AI response was not valid JSON. Falling back to default logic.");
    return { done: true };
  }
}

module.exports = checkIfDone;

