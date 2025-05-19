// doneChecker.js

require("dotenv").config();
const OpenAI = require("openai");
const fs = require("fs");

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

async function doneChecker(fields, requiredFields = [], config = {}) {
  // ✅ Skip if final_notes is clearly dismissive
  const normalized = fields.final_notes?.toLowerCase().trim();
  const accepted = ["no", "none", "n/a", "nothing else", "not sure"];
  if (accepted.includes(normalized)) {
    console.log("[doneChecker] Bypassing GPT: acceptable 'final_notes'");
    return { isComplete: true, missingFields: [] };
  }

  // ✅ Load remote prompt if available
  let donePrompt = config.doneCheckerPrompt;
  if (!donePrompt) {
    try {
      donePrompt = fs.readFileSync("./prompts/intake-done-checker.txt", "utf8");
    } catch (err) {
      console.warn("⚠️ No remote or local doneChecker prompt found:", err.message);
      donePrompt = "Determine if all required fields are present. Return ✅ if complete, otherwise list missing.";
    }
  }

  try {
    const promptWithFields = donePrompt.replace("{{fields}}", JSON.stringify(fields, null, 2));
    const completion = await openai.chat.completions.create({
      model: "gpt-4-turbo",
      messages: [{ role: "system", content: promptWithFields }]
    });

    const content = completion.choices[0].message.content;
    console.log("🧠 GPT doneChecker raw:", content);

    const isDone = content.includes("✅");
    const missingMatches = content.match(/Missing:\s*\[(.*?)\]/i);
    const missing = missingMatches
      ? missingMatches[1].split(",").map(f => f.trim().replace(/['"]/g, "")).filter(Boolean)
      : [];

    return { isComplete: isDone, missingFields: missing };
  } catch (err) {
    console.error("❌ GPT error in doneChecker:", err.message);
    // 🧠 Hybrid fallback
    const missing = requiredFields.filter(f => !fields[f] || fields[f].trim() === "");
    return { isComplete: missing.length === 0, missingFields: missing };
  }
}

module.exports = doneChecker;
