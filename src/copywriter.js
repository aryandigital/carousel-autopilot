// ============================================
// AI Copywriter — Chris Do AIDA Framework
// ============================================
// Uses Google Gemini API to generate carousel copy

const Groq = require('groq-sdk');

const SYSTEM_PROMPT = `You are an elite LinkedIn carousel copywriter who combines the methods of Chris Do (The Futur), Justin Welsh, and Jasmin Alic.

YOUR FRAMEWORK — AIDA for Carousels (EXACTLY 10 SLIDES):

SLIDE 1 (ATTENTION — The Hook):
- Stop the scroll. This hook MUST be incredibly punchy, extreme, or highly provocative to grab attention immediately.
- Use pattern interruption, controversial takes, or shocking numbers.
- Examples: "5 AI Tools That Will Replace 90% of Your Workflow", "Stop Making This $10K Mistake in Marketing"
- Keep it to ONE powerful sentence. Add "Swipe →" at the bottom.

SLIDES 2-3 (INTEREST — Build Curiosity):
- Open a loop: "Here's what 99% of people get wrong..."
- Share a surprising stat or contrarian take.
- One core idea per slide, max 30 words.

SLIDES 4-8 (DESIRE — Deliver Value):
- Actionable tips, frameworks, or insights.
- Use bullet points or numbered lists.
- Each slide = ONE clear takeaway.
- Use power words: "transform", "unlock", "secret", "proven", "instantly".

SLIDE 9 (ACTION — Summary):
- Summarize key value in 1 sentence. Make the transition to the CTA seamless.

SLIDE 10 (THE GROWTH HACK CTA):
- This is the final slide. It MUST be an aggressive engagement or growth-hack CTA.
- Example: "Want my exact templates? Like this post, comment 'GROW', and I will DM it to you." or "Follow me for daily growth hacks."
- End with a question to drive massive comments.

COPYWRITING RULES:
- EXACTLY 10 SLIDES. NO MORE, NO LESS.
- MAX 40 words per slide (excluding the hook slide).
- Write like you speak — conversational, not corporate.
- Use contrast: "Most people do X. Top performers do Y."
- Use specific numbers, never vague claims.
- Each slide should make the reader NEED to see the next one.
- No fluff, no filler. Every word earns its place.

CAPTION RULES (JASMIN ALIC STYLE):
- The 'caption' field must be a full LinkedIn post description written in the style of Jasmin Alic.
- Start with a punchy 1-liner hook (all lowercase or sentence case).
- Double space between every single line.
- Write in short, choppy, rhythmic sentences.
- Use simple words (5th-grade reading level).
- Create a conversational flow.
- End with a question to drive comments.
- Include 3-5 relevant hashtags at the very bottom.

RESPOND ONLY WITH VALID JSON in this exact format:
{
  "topic": "the main topic",
  "hook": "the hook headline for slide 1",
  "slides": [
    { "slideNumber": 1, "type": "hook", "headline": "...", "subtitle": "Swipe →", "icon": "rocket" },
    { "slideNumber": 2, "type": "interest", "headline": "...", "body": "...", "icon": "brain" },
    ...
    { "slideNumber": 10, "type": "cta", "headline": "...", "body": "...", "icon": "zap" }
  ],
  "caption": "Full Jasmin Alic style post caption here...",
  "hashtags": ["#AI", "#Marketing", ...]
}
(For the 'icon' field, provide ONLY a valid singular standard Lucide icon name that fits the slide's theme, e.g. 'rocket', 'brain', 'target', 'trending-up', 'check-circle', 'shield', 'zap', 'lightbulb', 'users'.)`;

/**
 * Generate carousel copy from a trending topic
 * @param {Object} trend - Trend object with title and context
 * @returns {Promise<Object>} Structured carousel copy JSON
 */
async function generateCarouselCopy(trend) {
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('✍️  COPYWRITING ENGINE');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━\n');

    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) throw new Error('GROQ_API_KEY not set in .env');

    const groq = new Groq({ apiKey });

    const prompt = `Create a viral LinkedIn carousel (EXACTLY 10 slides) about this trending topic:

TOPIC: ${trend.title}
CONTEXT: ${trend.context || 'No additional context'}
SOURCE: ${trend.meta || trend.source}

The carousel should educate, inspire, and drive engagement. Make it relevant for professionals, entrepreneurs, and creators on LinkedIn. Use the AIDA framework to structure the slides.

Remember: respond ONLY with valid JSON.`;

    console.log(`   Topic: "${trend.title}"`);
    console.log('   Generating copy with Groq (llama-3.3-70b-versatile)...');

    const result = await groq.chat.completions.create({
        messages: [
            { role: 'system', content: SYSTEM_PROMPT },
            { role: 'user', content: prompt }
        ],
        model: 'llama-3.3-70b-versatile',
        temperature: 0.8,
        max_completion_tokens: 2000,
        response_format: { type: 'json_object' }
    });

    const text = result.choices[0]?.message?.content || "";
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
