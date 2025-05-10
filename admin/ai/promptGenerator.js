const { OpenAI } = require('openai');
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

async function generatePrompts(purpose, business, tone) {
  // STEP 1: Use GPT-3.5 to generate the Chat Responder Prompt
  const chatSystemPrompt = `
You are a professional AI architect. Based on the following:
- Purpose: ${purpose}
- Business Type: ${business}
- Tone: ${tone || 'default'}

Generate only the full Chat Responder Prompt that will guide the AI's tone, behavior, and purpose.
Do NOT include anything else. Only return the prompt text.`;

  const chatResponse = await openai.chat.completions.create({
    model: 'gpt-3.5-turbo',
    messages: [{ role: 'user', content: chatSystemPrompt }]
  });

  const chatResponderPrompt = chatResponse.choices?.[0]?.message?.content?.trim() || '';

  // STEP 2: Use GPT-4 Turbo to extract required field names based on that prompt
  const extractSystemPrompt = `
You are an AI analyst. Based on the following chat prompt:

${chatResponderPrompt}

Identify the fields that should be extracted from a user's conversation with this AI (e.g. name, email, project goal, etc). 

Return a clean comma-separated list like:
full_name, email, phone, budget, project_goal
`;

  const fieldResponse = await openai.chat.completions.create({
    model: 'gpt-4-turbo',
    messages: [{ role: 'user', content: extractSystemPrompt }]
  });

  const fieldsRaw = fieldResponse.choices?.[0]?.message?.content?.trim() || '';
  const fieldList = fieldsRaw
    .split(/[\s,]+/)
    .map(f => f.trim().replace(/[^a-zA-Z0-9_]/g, ''))
    .filter(Boolean);

  // STEP 3: Create the Intake Extractor Prompt from the field list
  const intakeExtractorPrompt = `Extract the following fields from the user's messages: ${fieldList.join(', ')}. Return them as structured JSON.`;

  return {
    chatResponderPrompt,
    intakeExtractorPrompt,
    requiredFields: fieldList
  };
}

module.exports = { generatePrompts };

