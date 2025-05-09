require("dotenv").config();
const OpenAI = require("openai");
const fs = require("fs");

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

async function doneChecker(fields) {
  // ✅ Shortcut: accept short, clear "no" or "n/a" answers
  const normalized = fields.final_notes?.toLowerCase().trim();
  if (normalized === "no" || normalized === "none" || normalized === "n/a" || normalized === "nothing else") {
    console.log("[doneChecker] Bypassing AI: 'final_notes' is short and acceptable.");
    return { done: true, missing: [] };
  }

  let donePrompt = "";
  try {
    donePrompt = fs.readFileSync("./prompts/intake-done-checker.txt", "utf8");
  } catch (err) {
    console.warn("Prompt file missing or unreadable (doneChecker):", err.message);
  }

  try {
    const promptWithFields = donePrompt.replace("{{fields}}", JSON.stringify(fields, null, 2));
    console.log("[doneChecker] Checking fields:", fields);

    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [{ role: "system", content: promptWithFields }]
    });

    const content = completion.choices[0].message.content;
    console.log("🧠 Raw doneChecker AI response:", content);

    const isDone = content.includes("✅");
    const missingMatches = content.match(/Missing:\s*\[(.*?)\]/i);
    const missing = missingMatches
      ? missingMatches[1].split(",").map(f => f.trim().replace(/['"]/g, "")).filter(Boolean)
      : [];

    return { done: isDone, missing };
  } catch (error) {
    console.error("doneChecker AI error:", error.message);
    // 🧠 Hybrid fallback
    const requiredFields = ["full_name", "email", "phone", "garage_goals", "square_footage", "must_have_features", "budget", "start_date", "final_notes"];
    const missing = requiredFields.filter(field => !fields[field] || fields[field].trim().length === 0);
    console.warn("⚠️ Using hybrid fallback due to AI failure. Missing fields:", missing);
    return {
      done: missing.length === 0,
      missing
    };
  }
}

module.exports = doneChecker;
