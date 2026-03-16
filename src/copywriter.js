// ============================================
// AI Copywriter - High-Performance Carousel Framework
// ============================================
// Uses Google Gemini API to generate carousel copy

const { GoogleGenerativeAI } = require('@google/generative-ai');

const SYSTEM_PROMPT = `You are an elite LinkedIn carousel strategist and copywriter.

OUTPUT GOAL:
- Create a carousel that earns comments, saves, and shares.
- The voice should feel direct, founder-style, and sharp: short lines, clear opinion, no jargon.
- Specifically frame technical or design concepts through the lens of marketing psychology, behavioral economics, and conversion framing. Connect the tech to human behavior and sales outcomes.
- IMPORTANT: The exact Ideal Customer Profile (ICP) for this content is non-technical business owners or marketers who need high-converting websites to grow their business. Do not speak to other developers. Speak to business outcomes.
- Do not imitate any one creator verbatim.

FRAMEWORK (EXACTLY 10 SLIDES):

SLIDE 1 (HOOK):
- Must create tension in under 14 words.
- Use one of these proven hook types:
  1) painful truth
  2) contrarian take
  3) costly mistake
  4) specific result + timeframe
- Include a clear curiosity gap.
- DYNAMIC TYPOGRAPHY: wrap 1-3 high-impact words in *asterisks*.
- Subtitle must be exactly: "Swipe ->"

SLIDES 2-3 (SETUP):
- Diagnose the problem fast.
- One idea per slide, max 18 words.
- Make the reader feel seen.
- DYNAMIC TYPOGRAPHY: wrap 1-2 key words in *asterisks*.

SLIDES 4-8 (VALUE):
- Practical, specific, usable.
- Each slide gives one concrete move, framework, or example.
- Avoid vague advice like "be consistent" unless you make it measurable.
- Max 24 words per slide.
- DYNAMIC TYPOGRAPHY: wrap 1-2 key words in *asterisks*.

SLIDE 9 (PAYOFF):
- Recap the transformation in 1 sentence.
- Bridge naturally into action.
- DYNAMIC TYPOGRAPHY: wrap 1-2 key words in *asterisks*.

SLIDE 10 (CTA):
- Explicitly pitch the end-result: getting more clients and higher-quality clients.
- Frame your custom website development services purely as the *vehicle* to achieve those business results. Don't sell "websites", sell "conversion engines that book you better clients."
- CTA: Ask them to comment a word (e.g. "Comment *CLIENTS*") to get a free conversion audit or to book a call.
- Make the reward explicit and highly focused on revenue or lead acquisition.

COPY RULES:
- EXACTLY 10 slides. No more, no less.
- Max 25 words per slide.
- No generic filler, no corporate phrasing, no motivational cliches.
- Use plain language, 5th-8th grade readability.
- Every slide must contain at least one *asterisk-highlighted* phrase in headline or body.
- Slides 2-10 should include both a concise headline and a concise body (body ideally 6-14 words).

CAPTION RULES (FOUNDER-CREATOR LINKEDIN STYLE):
- 'caption' must be a full LinkedIn post description.
- Start with a punchy one-line hook.
- Use short rhythmic lines with double line breaks.
- Include one story beat, one insight beat, one action beat.
- End with a question that invites real discussion.
- Add 3-5 relevant hashtags at the bottom.

RESPOND ONLY WITH VALID JSON in this exact format:
{
  "topic": "the main topic",
  "hook": "the hook headline for slide 1",
  "slides": [
    { "slideNumber": 1, "type": "hook", "headline": "The 5 AI tools that will *replace* you.", "subtitle": "Swipe ->", "icon": "rocket" },
    { "slideNumber": 2, "type": "interest", "headline": "You're probably *wasting hours*.", "body": "...", "icon": "brain" },
    ...
    { "slideNumber": 10, "type": "cta", "headline": "Comment *REPLACE*", "body": "...", "icon": "zap" }
  ],
  "caption": "Full LinkedIn caption here...",
  "hashtags": ["#AI", "#Marketing", ...]
}
(For the 'icon' field, provide ONLY a valid singular standard Lucide icon name that fits the slide's theme, e.g. 'rocket', 'brain', 'target', 'trending-up', 'check-circle', 'shield', 'zap', 'lightbulb', 'users'.)`;

/**
 * Generate carousel copy from a trending topic
 * @param {Object} trend - Trend object with title and context
 * @returns {Promise<Object>} Structured carousel copy JSON
 */
async function generateCarouselCopy(trend) {
    console.log('\n========================');
    console.log('COPYWRITING ENGINE');
    console.log('========================\n');

    // Pick a random creative angle to force variety
    const angles = [
        'contrarian hot take', 'beginner-friendly explainer', 'advanced strategy breakdown',
        'lessons from failure', 'surprising data insights', 'future predictions',
        'practical step-by-step guide', 'myth-busting', 'behind-the-scenes look',
        'comparison of approaches', 'personal story framework', 'industry disruption angle'
    ];
    const chosenAngle = angles[Math.floor(Math.random() * angles.length)];

    const prompt = `Create a high-performing LinkedIn carousel (EXACTLY 10 slides) about this trending topic:

TOPIC: ${trend.title}
CONTEXT: ${trend.context || 'No additional context'}
SOURCE: ${trend.meta || trend.source}

CREATIVE ANGLE: Use a "${chosenAngle}" approach. Do NOT just summarize the topic - find a surprising, specific, and non-obvious angle that stops the scroll.

The carousel should educate business owners on the psychology of design and drive engagement. Use specific psychological principles, and frame the problem around losing high-quality clients or leaking revenue. The ultimate point of the carousel is to show how a psychologically-optimized website serves as an engine to get *more clients* and *higher quality clients*. Provide concrete actions they can take to stop bleeding leads.

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
                const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${openRouterKey}`,
                        'HTTP-Referer': 'https://github.com/carousel-automation',
                        'X-Title': 'Carousel Automation AI',
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        model: modelId,
                        messages: [
                            { role: 'system', content: SYSTEM_PROMPT },
                            { role: 'user', content: prompt }
                        ]
                    })
                });

                if (res.ok) {
                    const data = await res.json();
                    const raw = data.choices?.[0]?.message?.content || '';
                    // Some models wrap JSON in <think>...</think> tags - strip those
                    text = raw.replace(/<think>[\s\S]*?<\/think>/g, '').trim();
                    if (text) {
                        console.log(`   OpenRouter (${modelId}) responded successfully`);
                    } else {
                        console.log(`   OpenRouter (${modelId}) returned empty, trying next...`);
                    }
                } else {
                    const errBody = await res.text();
                    console.log(`   OpenRouter (${modelId}) failed: ${res.status} - ${errBody.slice(0, 100)}`);
                }
            } catch (err) {
                console.log(`   OpenRouter (${modelId}) error: ${err.message}`);
            }
        }
    }

    // 2. Fallback to Gemini
    if (googleKey && !text) {
        const genAI = new GoogleGenerativeAI(googleKey);

        // Try multiple models - each has separate daily quota on free tier
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
                    console.log(`   ${modelName} responded successfully`);
                    break;
                } catch (err) {
                    if (err.message && err.message.includes('429') && attempt < maxRetries) {
                        const waitSec = 20 * attempt;
                        console.log(`   Rate limited on ${modelName}. Retrying in ${waitSec}s...`);
                        await new Promise(r => setTimeout(r, waitSec * 1000));
                    } else if (err.message && err.message.includes('429')) {
                        console.log(`   ${modelName} quota exhausted, trying next model...`);
                        break;
                    } else {
                        console.log(`   ${modelName} failed, trying next...`);
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
        text = result.choices[0]?.message?.content || '';
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

    console.log(`   Generated ${carouselData.slides?.length || 0} slides`);
    console.log(`   Hook: "${carouselData.hook || carouselData.slides?.[0]?.headline}"`);

    return carouselData;
}

module.exports = { generateCarouselCopy };
