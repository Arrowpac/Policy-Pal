import { groq } from './gemini'

const MODEL = 'llama-3.3-70b-versatile'

// ── Simplify a policy into plain English ───────────────────────
export async function simplifyPolicy(rawText) {
  const response = await groq.chat.completions.create({
    model: MODEL,
    temperature: 0.3,
    messages: [
      {
        role: 'system',
        content: `You are an insurance expert who explains policies in simple, plain English.
Analyze the insurance policy text and return ONLY a valid JSON object with this exact structure, no markdown, no backticks, no explanation:
{
  "summary": "2-3 sentence plain English summary",
  "policyType": "health | vehicle | life | home | travel | other",
  "covered": ["things covered"],
  "notCovered": ["exclusions"],
  "keyDetails": [
    { "label": "Coverage Amount", "value": "..." },
    { "label": "Premium", "value": "..." },
    { "label": "Deductible", "value": "..." },
    { "label": "Policy Period", "value": "..." }
  ],
  "redFlags": [
    {
      "clause": "problematic clause",
      "explanation": "why this is concerning",
      "severity": "high | medium | low"
    }
  ],
  "simplifiedClauses": [
    {
      "original": "complex legal text",
      "simplified": "what it actually means"
    }
  ]
}`
      },
      {
        role: 'user',
        content: `Analyze this insurance policy:\n\n${rawText.slice(0, 12000)}`
      }
    ],
  })

  const text = response.choices[0].message.content.trim()
  // Strip markdown code blocks if present
  const clean = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
  return JSON.parse(clean)
}

// ── Answer a question about a specific policy ──────────────────
export async function askPolicyQuestion(rawText, question, chatHistory = []) {
  const messages = [
    {
      role: 'system',
      content: `You are an insurance expert helping a user understand their specific policy.
Answer questions based ONLY on the policy text provided.
Be concise, clear, and use plain English.
If the answer is not in the policy, say so honestly.

Policy text:
${rawText.slice(0, 10000)}`
    },
    ...chatHistory.slice(-6).map(m => ({
      role: m.role,
      content: m.content,
    })),
    {
      role: 'user',
      content: question,
    }
  ]

  const response = await groq.chat.completions.create({
    model: MODEL,
    temperature: 0.4,
    messages,
  })

  return response.choices[0].message.content.trim()
}