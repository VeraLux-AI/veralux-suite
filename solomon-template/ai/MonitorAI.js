const OpenAI = require("openai");
const doneChecker = require("./doneChecker");
const intakeExtractor = require("./intakeExtractor");

// Optional fallback handler (modular support for future AI failovers or escalations)
let fallbackHandler;
try {
  fallbackHandler = require("./fallbackHandler");
} catch {
  fallbackHandler = ({ reason = "MonitorAI fallback", config = {} }) => ({
    isComplete: false,
    nextStep: "wait",
    reply: config.fallbackMessage || "Thanks! Let me know when you're ready to continue.",
    triggerUpload: false,
    missingFields: [],
    showSummary: false
  });
}

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

async function MonitorAI({ conversation = [], intakeData = {}, sessionMemory = {}, config = {} }) {
  const {
    requiredFields = [],
    photoField = "photo",
    photoRequired = true,
    generatePdfWithoutPhoto = false,
    photoPrompt = "📸 Before we wrap up, could you upload a photo or skip?",
    completeMessage = "✅ All set! Ready to finalize your project summary.",
    fallbackMessage = "Thanks! Let me know when you're ready to continue.",
    industry = "service"
  } = config;

  const done = await doneChecker(intakeData, requiredFields);
  const missingFields = done?.missingFields || [];

  const photoUploaded = intakeData[photoField] === "Uploaded";
  const photoSkipped = intakeData[photoField] === "Skipped";

  // STEP 1: Missing required fields
  if (!done?.isComplete) {
    const prompt = `
You are a helpful assistant guiding a user through an intake process for a ${industry} project.
The following fields are missing: ${missingFields.join(", ")};
Respond with a concise, friendly message asking for one of these fields next.
Reply only in JSON format like:
{
  "nextStep": "ask_field",
  "missingFields": [...],
  "reply": "Your message to the user here"
}`;

    try {
      const response = await openai.chat.completions.create({
        model: "gpt-4-turbo",
        messages: [
          { role: "system", content: prompt },
          { role: "user", content: conversation.map(m => `${m.role}: ${m.content}`).join("\n") }
        ]
      });

      const content = response.choices[0].message.content.trim();
      const parsed = JSON.parse(content);

      if (process.env.VERBOSE_LOGGING === "true") {
        console.log("[MonitorAI] AI response for missing fields:", parsed);
      }

      return {
        isComplete: false,
        nextStep: parsed.nextStep || "ask_field",
        missingFields,
        reply: parsed.reply || "",
        triggerUpload: false,
        showSummary: false
      };
    } catch (err) {
      console.warn("[MonitorAI] OpenAI failed or invalid JSON:", err.message);
      return {
        isComplete: false,
        nextStep: "ask_field",
        missingFields,
        reply: "Almost done! Could you answer the remaining questions?",
        triggerUpload: false,
        showSummary: false
      };
    }
  }

  // STEP 2: Photo is required but not uploaded or skipped
  if (done?.isComplete && photoRequired && !photoUploaded && !photoSkipped) {
    return {
      isComplete: false,
      nextStep: "request_photo",
      reply: photoPrompt,
      triggerUpload: true,
      missingFields: [],
      showSummary: false
    };
  }

  // STEP 3: All required inputs and photo (or skip) satisfied
  const canProceed =
    !photoRequired || photoUploaded || photoSkipped || generatePdfWithoutPhoto;

  if (done?.isComplete && canProceed) {
    if (process.env.VERBOSE_LOGGING === "true") {
      console.log("[MonitorAI] Intake complete. Proceeding to summary.");
    }

    return {
      isComplete: true,
      nextStep: "submit_summary",
      reply: completeMessage,
      triggerUpload: false,
      missingFields: [],
      showSummary: true
    };
  }

  // STEP 4: Catch-all fallback
  return fallbackHandler({
    reason: "MonitorAI final fallback",
    config
  });
}

module.exports = MonitorAI;
