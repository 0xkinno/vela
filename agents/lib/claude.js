import Groq from "groq-sdk"

const client = new Groq({ apiKey: process.env.GROQ_API_KEY })

export async function askClaude(systemPrompt, userPrompt, maxTokens = 800) {
  try {
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
      const jsonMatch = text.match(/```json\n?([\s\S]*?)\n?```/) || text.match(/\{[\s\S]*\}/)
      if (jsonMatch) return JSON.parse(jsonMatch[1] || jsonMatch[0])
      return JSON.parse(text)
    } catch {
      return { text, raw: true }
    }
  } catch (err) {
    // Groq rate limit — return safe fallback instead of crashing
    if (err?.status === 429 || err?.message?.includes('429')) {
      console.warn('[Claude] Rate limit hit — returning fallback response')
      return {
        marketSentiment: "NEUTRAL",
        riskLevel: "LOW",
        ethTrend: "FLAT",
        aaveOpportunity: "MODERATE",
        recommendedAaveAllocation: 50,
        reasoning: "Rate limit reached — holding current allocation.",
        actionRequired: false,
        suggestedAction: "HOLD",
        urgency: "LOW",
        confidenceScore: 50,
        threatLevel: "NONE",
        emergencyExitRequired: false,
        healthScore: 100,
        shouldExecute: false,
        text: "Rate limit reached — holding current allocation.",
        raw: true,
      }
    }
    throw err
  }
}