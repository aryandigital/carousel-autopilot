// ============================================
// AI Copywriter — Chris Do AIDA Framework
// ============================================
// Uses Google Gemini API to generate carousel copy

const { GoogleGenerativeAI } = require('@google/generative-ai');

const SYSTEM_PROMPT = `You are an elite LinkedIn carousel copywriter who combines the methods of Chris Do (The Futur), Justin Welsh, and Jasmin Alic.

YOUR FRAMEWORK — AIDA for Carousels (EXACTLY 10 SLIDES):

SLIDE 1 (ATTENTION — The Hook):
<<<<<<< HEAD
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
=======
- Stop the scroll. This hook MUST be incredibly punchy, extreme, or highly provocative.
- Use pattern interruption, controversial takes, or shocking numbers.
- Example: "5 AI Tools That Will Replace 90% of Your Workflow"
- Keep it to ONE powerful sentence. Add "Swipe →" at the bottom.
- DYNAMIC TYPOGRAPHY: Wrap the most important 1-3 words in asterisks (e.g., "5 AI Tools That Will *Replace 90%* of Your Workflow") so we can highlight them in the design.

SLIDES 2-3 (INTEREST — Build Curiosity):
- Open a loop.
- One core idea per slide, max 20 words.
- DYNAMIC TYPOGRAPHY: Wrap 1-2 key words in asterisks for emphasis (e.g., "Here's what *99% of people* get wrong...").

SLIDES 4-8 (DESIRE — Deliver Value):
- Actionable tips, frameworks, or insights.
- Each slide = ONE clear takeaway. Max 25 words per slide.
- DYNAMIC TYPOGRAPHY: Wrap 1-2 key words in asterisks for emphasis (e.g., "Use *power words* to increase conversion").

SLIDE 9 (ACTION — Summary):
- Summarize key value in 1 sentence. Make the transition to the CTA seamless.
- DYNAMIC TYPOGRAPHY: Wrap 1-2 key words in asterisks for emphasis.

SLIDE 10 (THE GROWTH HACK CTA):
- This is the final slide. It MUST be an aggressive engagement or growth-hack CTA.
- Example: "Want my exact templates? Like this post, comment *GROW*, and I will DM it to you."

COPYWRITING RULES:
- EXACTLY 10 SLIDES. NO MORE, NO LESS.
- EXTREMELY SHORT TEXT. Max 25 words per slide.
- Write like you speak — conversational, not corporate.
- No fluff, no filler. Every word earns its place.
- DYNAMIC TYPOGRAPHY IS MANDATORY: You must use *asterisks* on every single slide's headline or body to identify the most important words to highlight visually.
>>>>>>> 5d4e29a (push fix)

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
<<<<<<< HEAD
    { "slideNumber": 1, "type": "hook", "headline": "...", "subtitle": "Swipe →", "icon": "rocket" },
    { "slideNumber": 2, "type": "interest", "headline": "...", "body": "...", "icon": "brain" },
    ...
    { "slideNumber": 10, "type": "cta", "headline": "...", "body": "...", "icon": "zap" }
=======
    { "slideNumber": 1, "type": "hook", "headline": "The 5 AI tools that will *replace* you.", "subtitle": "Swipe →", "icon": "rocket" },
    { "slideNumber": 2, "type": "interest", "headline": "You're probably *wasting hours*.", "body": "...", "icon": "brain" },
    ...
    { "slideNumber": 10, "type": "cta", "headline": "Comment *REPLACE*", "body": "...", "icon": "zap" }
>>>>>>> 5d4e29a (push fix)
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

    // Pick a random creative angle to force variety
    const angles = [
        'contrarian hot take', 'beginner-friendly explainer', 'advanced strategy breakdown',
        'lessons from failure', 'surprising data insights', 'future predictions',
        'practical step-by-step guide', 'myth-busting', 'behind-the-scenes look',
        'comparison of approaches', 'personal story framework', 'industry disruption angle'
    ];
    const chosenAngle = angles[Math.floor(Math.random() * angles.length)];

    const prompt = `Create a viral LinkedIn carousel (EXACTLY 10 slides) about this trending topic:

TOPIC: ${trend.title}
CONTEXT: ${trend.context || 'No additional context'}
SOURCE: ${trend.meta || trend.source}

CREATIVE ANGLE: Use a "${chosenAngle}" approach. Do NOT just summarize the topic — find a surprising, unique, or provocative angle that makes people stop scrolling.

The carousel should educate, inspire, and drive engagement. Make it relevant for professionals, entrepreneurs, and creators on LinkedIn. Use the AIDA framework to structure the slides.

Remember: respond ONLY with valid JSON.`;

    console.log(`   Topic: "${trend.title}"`);
    console.log(`   Angle: "${chosenAngle}"`);

    let text;

    // API Keys
    const openRouterKey = process.env.OPENROUTER_API_KEY;
    const googleKey = process.env.GOOGLE_AI_API_KEY;
    const groqKey = process.env.GROQ_API_KEY;

    // 1. Try OpenRouter first (multiple free models available)
    if (openRouterKey && !text) {
        const orModels = [
            'google/gemma-3-27b-it:free',
            'meta-llama/llama-3.3-70b-instruct:free',
            'qwen/qwen3-coder:free',
        ];
        // Pick a random starting model for load distribution
        const startIdx = Math.floor(Math.random() * orModels.length);

        for (let i = 0; i < orModels.length && !text; i++) {
            const modelId = orModels[(startIdx + i) % orModels.length];
            console.log(`   Trying OpenRouter (${modelId})...`);
            try {
                const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
                    method: "POST",
                    headers: {
                        "Authorization": `Bearer ${openRouterKey}`,
                        "HTTP-Referer": "https://github.com/carousel-automation",
                        "X-Title": "Carousel Automation AI",
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({
                        "model": modelId,
                        "messages": [
                            { "role": "system", "content": SYSTEM_PROMPT },
                            { "role": "user", "content": prompt }
                        ]
                    })
                });

                if (res.ok) {
                    const data = await res.json();
                    const raw = data.choices?.[0]?.message?.content || "";
                    // Some models wrap JSON in <think>...</think> tags — strip those
                    text = raw.replace(/<think>[\s\S]*?<\/think>/g, '').trim();
                    if (text) {
                        console.log(`   ✅ OpenRouter (${modelId}) responded successfully`);
                    } else {
                        console.log(`   ⚠️  OpenRouter (${modelId}) returned empty, trying next...`);
                    }
                } else {
                    const errBody = await res.text();
                    console.log(`   ⚠️  OpenRouter (${modelId}) failed: ${res.status} — ${errBody.slice(0, 100)}`);
                }
            } catch (err) {
                console.log(`   ⚠️  OpenRouter (${modelId}) error: ${err.message}`);
            }
        }
    }

    // 2. Fallback to Gemini
    if (googleKey && !text) {
        const { GoogleGenerativeAI } = require('@google/generative-ai');
        const genAI = new GoogleGenerativeAI(googleKey);

        // Try multiple models — each has separate daily quota on free tier
        const models = ['gemini-2.0-flash', 'gemini-2.0-flash-lite', 'gemini-1.5-pro'];

        for (const modelName of models) {
            if (text) break;
            console.log(`   Trying Gemini (${modelName})...`);
            const model = genAI.getGenerativeModel({ model: modelName });

            // Retry with exponential backoff
            const maxRetries = 2;
            for (let attempt = 1; attempt <= maxRetries; attempt++) {
                try {
                    const result = await model.generateContent({
                        contents: [
                            { role: 'user', parts: [{ text: SYSTEM_PROMPT + '\n\n' + prompt }] }
                        ],
                        generationConfig: {
                            temperature: 0.9,
                            maxOutputTokens: 2500,
                            responseMimeType: 'application/json',
                        },
                    });
                    text = result.response.text();
                    console.log(`   ✅ ${modelName} responded successfully`);
                    break;
                } catch (err) {
                    if (err.message && err.message.includes('429') && attempt < maxRetries) {
                        const waitSec = 20 * attempt;
                        console.log(`   ⏳ Rate limited on ${modelName}. Retrying in ${waitSec}s...`);
                        await new Promise(r => setTimeout(r, waitSec * 1000));
                    } else if (err.message && err.message.includes('429')) {
                        console.log(`   ⚠️  ${modelName} quota exhausted, trying next model...`);
                        break;
                    } else {
                        console.log(`   ⚠️  ${modelName} failed, trying next...`);
                        break;
                    }
                }
            }
        }
    }

    // Fallback to Groq if Gemini didn't produce output
    if (!text && groqKey) {
        console.log('   Generating copy with Groq (llama-3.3-70b-versatile)...');
        const Groq = require('groq-sdk');
        const groq = new Groq({ apiKey: groqKey });

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
        text = result.choices[0]?.message?.content || "";
    }

    if (!text) {
        throw new Error('No API key available or all attempts failed. Set GOOGLE_AI_API_KEY or GROQ_API_KEY in .env');
    }

    let carouselData;
    try {
        carouselData = JSON.parse(text);
    } catch {
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
