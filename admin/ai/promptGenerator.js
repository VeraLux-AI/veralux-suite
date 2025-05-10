
const { OpenAI } = require('openai');
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

async function generatePrompts(purpose, business, tone) {
  // Step 1: Generate Chat Responder Prompt with GPT-3.5
  const chatPromptSystem = `
You are an expert AI conversation designer.
Write a Chat Responder prompt for an AI assistant based on:

Purpose: ${purpose}
Business Type: ${business}
Tone: ${tone || 'default'}

This prompt will guide how the AI speaks, asks questions, and interacts with users.
Output only the prompt, no explanation.
`;

  const chatResponse = await openai.chat.completions.create({
    model: 'gpt-3.5-turbo',
    messages: [{ role: 'user', content: chatPromptSystem }],
  });

  const chatResponderPrompt = chatResponse.choices?.[0]?.message?.content.trim() || '';

  // Step 2: Extract Field List from Chat Prompt with GPT-4 Turbo
  const extractorSystem = `
You are an AI that analyzes intake assistant prompts and identifies structured fields to extract.

Here is a Chat Responder Prompt:
---
${chatResponderPrompt}
---

List the fields this AI will likely need to extract, in this format:

- full_name
- email
- phone
- (etc)

Only return a bullet list of field keys, one per line. Do not include extra commentary.
`;

  const extractResponse = await openai.chat.completions.create({
    model: 'gpt-4-turbo',
    messages: [{ role: 'user', content: extractorSystem }],
  });

  const rawFieldList = extractResponse.choices?.[0]?.message?.content || '';
  const fieldLines = rawFieldList.split('\n').map(l => l.replace(/^[-•*]\s*/, '').trim()).filter(Boolean);

  const intakeExtractorPrompt = `Extract the following fields from the user conversation: ${fieldLines.join(', ')}. Return them as structured JSON.`;

  return {
    chatResponderPrompt,
    intakeExtractorPrompt,
    requiredFields: fieldLines
  };
}

module.exports = { generatePrompts };
