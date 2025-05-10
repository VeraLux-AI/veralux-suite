const { OpenAI } = require('openai');
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

async function generatePrompts(purpose, business, tone) {
  const systemPrompt = `
You are an AI prompt engineer. Based on the following:
- Purpose: ${purpose}
- Business Type: ${business}
- Tone: ${tone || 'default'}

Generate:
1. A Chat Responder prompt (how the AI should talk).
2. An Intake Extractor prompt (which structured fields should be extracted).
`;

  const response = await openai.chat.completions.create({
    model: "gpt-3.5-turbo",
    messages: [{ role: "user", content: systemPrompt }]
  });

  const raw = response.choices?.[0]?.message?.content || '';
  const [chatResponderPrompt, intakeExtractorPrompt] = raw.split(/\n\s*\n/);

  return {
    chatResponderPrompt: chatResponderPrompt.trim(),
    intakeExtractorPrompt: intakeExtractorPrompt.trim()
  };
}

module.exports = { generatePrompts };
