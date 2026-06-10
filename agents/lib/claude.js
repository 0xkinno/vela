// agents/lib/claude.js
import Groq from "groq-sdk"

const client = new Groq({
  apiKey: process.env.GROQ_API_KEY,
})

export async function askClaude(systemPrompt, userPrompt, maxTokens = 1024) {
  const response = await client.chat.completions.create({
    model: "llama-3.3-70b-versatile",
    max_tokens: maxTokens,
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ],
  })

  const text = response.choices[0].message.content

  try {
    const jsonMatch = text.match(/```json\n?([\s\S]*?)\n?```/) ||
                      text.match(/\{[\s\S]*\}/)
    if (jsonMatch) return JSON.parse(jsonMatch[1] || jsonMatch[0])
    return JSON.parse(text)
  } catch {
    return { text, raw: true }
  }
}