// ============================================
// AI Copywriter — Chris Do AIDA Framework
// ============================================
// Uses Google Gemini API to generate carousel copy

const { GoogleGenerativeAI } = require('@google/generative-ai');

const SYSTEM_PROMPT = `You are an elite LinkedIn carousel copywriter who combines the methods of Chris Do (The Futur), Justin Welsh, and Jasmin Alic.

YOUR FRAMEWORK — AIDA for Carousels:

SLIDE 1 (ATTENTION — The Hook):
- Stop the scroll. Use a bold, provocative statement or number.
- Pattern: "X [things/mistakes/secrets] that [surprising outcome]"
- Examples: "5 AI Tools That Will Replace 90% of Your Workflow", "Stop Making This $10K Mistake in Marketing"
- Keep it to ONE powerful sentence. Add "Swipe →" at the bottom.

SLIDES 2-3 (INTEREST — Build Curiosity):
- Open a loop: "Here's what 99% of people get wrong..."
- Share a surprising stat or contrarian take.
- One core idea per slide, max 30 words.

SLIDES 4-7 (DESIRE — Deliver Value):
- Actionable tips, frameworks, or insights.
- Use bullet points or numbered lists.
- Each slide = ONE clear takeaway.
- Use power words: "transform", "unlock", "secret", "proven", "instantly".

SLIDE 8-9 (ACTION — CTA):
- Summarize key value in 1 sentence.
- CTA: "Follow @[profile] for daily insights" or "Save this for later ♻️"
- End with engagement prompt: "Which tip was your favorite? Comment below 👇"

COPYWRITING RULES:
- MAX 40 words per slide (excluding the hook slide).
- Write like you speak — conversational, not corporate.
- Use contrast: "Most people do X. Top performers do Y."
- Use specific numbers, never vague claims.
- Each slide should make the reader NEED to see the next one.
- No fluff, no filler. Every word earns its place.

RESPOND ONLY WITH VALID JSON in this exact format:
{
  "topic": "the main topic",
  "hook": "the hook headline for slide 1",
  "slides": [
    { "slideNumber": 1, "type": "hook", "headline": "...", "subtitle": "Swipe →" },
    { "slideNumber": 2, "type": "interest", "headline": "...", "body": "..." },
    ...
    { "slideNumber": 8, "type": "cta", "headline": "...", "body": "..." }
  ],
  "caption": "LinkedIn post caption (first 3 lines are visible before 'see more'). Include 3-5 hashtags.",
  "hashtags": ["#AI", "#Marketing", ...]
}`;

/**
 * Generate carousel copy from a trending topic
 * @param {Object} trend - Trend object with title and context
 * @returns {Promise<Object>} Structured carousel copy JSON
 */
async function generateCarouselCopy(trend) {
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('✍️  COPYWRITING ENGINE');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━\n');

    const apiKey = process.env.GOOGLE_AI_API_KEY;
    if (!apiKey) throw new Error('GOOGLE_AI_API_KEY not set in .env');

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

    const prompt = `Create a viral LinkedIn carousel (8-9 slides) about this trending topic:

TOPIC: ${trend.title}
CONTEXT: ${trend.context || 'No additional context'}
SOURCE: ${trend.meta || trend.source}

The carousel should educate, inspire, and drive engagement. Make it relevant for professionals, entrepreneurs, and creators on LinkedIn. Use the AIDA framework to structure the slides.

Remember: respond ONLY with valid JSON.`;

    console.log(`   Topic: "${trend.title}"`);
    console.log('   Generating copy with Gemini...');

    const result = await model.generateContent({
        contents: [
            { role: 'user', parts: [{ text: SYSTEM_PROMPT + '\n\n' + prompt }] },
        ],
        generationConfig: {
            temperature: 0.9,
            maxOutputTokens: 2000,
            responseMimeType: 'application/json',
        },
    });

    const text = result.response.text();
    let carouselData;

    try {
        carouselData = JSON.parse(text);
    } catch {
        // Try to extract JSON from the response
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
            carouselData = JSON.parse(jsonMatch[0]);
        } else {
            throw new Error('Failed to parse carousel copy from AI response');
        }
    }

    console.log(`   ✅ Generated ${carouselData.slides?.length || 0} slides`);
    console.log(`   Hook: "${carouselData.hook || carouselData.slides?.[0]?.headline}"`);

    return carouselData;
}

module.exports = { generateCarouselCopy };
