// ============================================
// Image Generator — AI Illustration + SVG Renderer
// ============================================
// Generates stunning carousels with AI-generated illustrations

const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

// Premium color palettes — each with a unique mood
const PALETTES = [
    { 
        name: 'apple-premium', 
        bg: '#FFFFFF', 
        bg2: '#F8F9FA', 
        accent: '#3945D3', 
        text: '#111827', 
        subtle: '#8A94D4', 
        mood: 'clean premium bright', 
        dark: false 
    },
];

function parseCsvEnv(name) {
    const raw = process.env[name];
    if (!raw) return [];
    return String(raw).split(',').map((v) => v.trim()).filter(Boolean);
}

function unique(values) {
    return [...new Set(values.filter(Boolean))];
}

function maskSecret(value = '') {
    if (!value || value.length < 10) return '[hidden]';
    return `${value.slice(0, 6)}...${value.slice(-4)}`;
}

function logOnce(runtimeState, key, message) {
    if (runtimeState.logged.has(key)) return;
    runtimeState.logged.add(key);
    console.log(message);
}

/**
 * Fetch an AI-generated illustration from Pollinations.ai (FREE, NO KEY)
 */
async function fetchPollinationsIllustration(headline, palette, slideType) {
    console.log(`      Trying Pollinations for "${headline.slice(0, 20)}..."`);
    try {
        let subjectHint = headline.replace(/[^a-zA-Z0-9\s]/g, '').slice(0, 50);
        const styleHints = [
            'crayon drawing',
            'no text',
            'centered object',
            'white background'
        ];
        
        const prompt = `${subjectHint}, ${styleHints.join(', ')}`;
        const seed = Math.floor(Math.random() * 1000000);
        
        // Use a different subdomain and randomize model
        const url = `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?nologo=true`;

        // Wait a bit
        await new Promise(r => setTimeout(r, 6000));

        const res = await fetch(url);
        
        if (!res.ok) {
            console.log(`      ⚠️  Pollinations returned ${res.status}`);
            return null;
        }

        const arrayBuffer = await res.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        if (buffer.length < 3000) return null;

        console.log(`      ✅ Pollinations illustration received (${Math.round(buffer.length / 1024)}KB)`);
        return buffer;
    } catch (err) {
        console.log(`      ⚠️  Pollinations error: ${err.message}`);
        return null;
    }
}

/**
 * Fetch from Gemini (Google)
 */
async function fetchGeminiIllustration(headline, palette, slideType, runtimeState) {
    const googleKeys = unique([
        ...parseCsvEnv('GOOGLE_IMAGE_API_KEYS'),
        process.env.GOOGLE_AI_API_KEY,
    ]);
    if (googleKeys.length === 0) return null;

    const imageModels = parseCsvEnv('GOOGLE_IMAGE_MODELS').length > 0
        ? parseCsvEnv('GOOGLE_IMAGE_MODELS')
        : ['gemini-2.0-flash', 'gemini-1.5-flash'];

    const subjectHint = headline.replace(/[^a-zA-Z0-9\s]/g, '').slice(0, 80);
    const prompt = [
        `${subjectHint}`,
        'childlike crayon drawing',
        'wax crayon texture on white paper',
        'no text no letters',
        'single centered object',
        `${palette.mood} colors`,
    ].join(', ');

    for (const key of googleKeys) {
        if (runtimeState.exhaustedGoogleKeys.has(key)) continue;
        for (const model of imageModels) {
            try {
                const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        contents: [{ role: 'user', parts: [{ text: prompt }] }],
                        generationConfig: { responseModalities: ['TEXT', 'IMAGE'] },
                    }),
                });

                if (!res.ok) {
                    const err = await res.text();
                    console.log(`      ⚠️  Gemini (${model}) returned ${res.status}: ${err.slice(0, 50)}`);
                    if (res.status === 429) {
                        runtimeState.exhaustedGoogleKeys.add(key);
                        break;
                    }
                    continue;
                }

                const data = await res.json();
                const parts = data?.candidates?.[0]?.content?.parts || [];
                const inline = parts.find((p) => p.inlineData?.data);
                if (!inline?.inlineData?.data) {
                     console.log(`      ⚠️  Gemini (${model}) returned no image data`);
                     continue;
                }

                const buffer = Buffer.from(inline.inlineData.data, 'base64');
                console.log(`      ✅ Gemini illustration via ${model} (${Math.round(buffer.length / 1024)}KB)`);
                return buffer;
            } catch (err) {
                console.log(`      ⚠️  Gemini (${model}) error: ${err.message}`);
            }
        }
    }
    return null;
}

/**
 * Fetch from OpenRouter (Alternative)
 */
async function fetchOpenRouterIllustration(headline, palette, slideType) {
    const key = process.env.OPENROUTER_API_KEY;
    if (!key) return null;

    try {
        const subjectHint = headline.replace(/[^a-zA-Z0-9\s]/g, '').slice(0, 80);
        const prompt = `${subjectHint}, childlike crayon drawing, wax crayon texture on white paper, no text, single centered object`;

        const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${key}`,
                'Content-Type': 'application/json',
                'HTTP-Referer': 'https://github.com/aryandigital/carousel-autopilot',
                'X-Title': 'Carousel Autopilot'
            },
            body: JSON.stringify({
                model: 'openai/dall-e-3', // Try DALL-E 3 if they have credits
                messages: [{ role: 'user', content: prompt }]
            }),
        });

        if (!res.ok) {
            const err = await res.text();
            console.log(`      ⚠️  OpenRouter returned ${res.status}: ${err.slice(0, 50)}`);
            return null;
        }
        const data = await res.json();
        const b64 = data?.choices?.[0]?.message?.content; // DALL-E 3 on OpenRouter might return something else
        // OpenRouter's DALL-E 3 output format is not directly base64 image data in 'content'.
        // It usually returns a URL to the image. This part needs adjustment based on actual API response.
        // For now, we'll return null as the direct base64 extraction is unlikely to work.
        console.log(`      ⚠️  OpenRouter (DALL-E 3) returned text, not image data. Needs parsing.`);
        return null; 
    } catch (err) {
        console.log(`      ⚠️  OpenRouter error: ${err.message}`);
        return null;
    }
}

/**
 * Fetch from Hugging Face
 */
async function fetchFluxIllustration(headline, palette, slideType, runtimeState) {
    const hfTokens = unique([
        ...parseCsvEnv('HF_TOKENS'),
        process.env.HF_TOKEN,
    ]);
    if (hfTokens.length === 0) return null;

    try {
        let subjectHint = headline.replace(/[^a-zA-Z0-9\s]/g, '').slice(0, 60);
        const styleHints = [
            'childlike crayon drawing',
            'wax crayon texture on paper',
            'no text no typography',
            'centered single iconic object',
            `${palette.mood} color scheme`,
        ];
        const prompt = `${subjectHint}, ${styleHints.join(', ')}`;

        for (const hfToken of hfTokens) {
            if (runtimeState.exhaustedHfTokens.has(hfToken)) continue;

            const res = await fetch('https://router.huggingface.co/hf-inference/models/stabilityai/stable-diffusion-xl-base-1.0', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${hfToken}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ inputs: prompt }),
            });

            if (!res.ok) {
                const err = await res.text();
                console.log(`      ⚠️  HF returned ${res.status}: ${err.slice(0, 50)}`);
                if (res.status === 402 || res.status === 429 || res.status === 401) {
                    runtimeState.exhaustedHfTokens.add(hfToken);
                    continue;
                }
                continue;
            }

            const arrayBuffer = await res.arrayBuffer();
            const buffer = Buffer.from(arrayBuffer);
            if (buffer.length < 1000) continue;

            console.log(`      ✅ FLUX illustration received (${Math.round(buffer.length / 1024)}KB)`);
            return buffer;
        }
        return null;
    } catch (err) {
        console.log(`      ⚠️  HF error: ${err.message}`);
        return null;
    }
}

/**
 * Procedural SVG Fallback
 */
function generateIllustrationSVG(headline, palette, slideType, slideNum) {
    let hash = 0;
    for (let i = 0; i < headline.length; i++) {
        hash = ((hash << 5) - hash + headline.charCodeAt(i)) | 0;
    }
    const seed = (n) => Math.abs((hash * (n + 1) * 9301 + 49297) % 233280) / 233280;
    const accent = palette.accent;
    const subtle = palette.subtle;

    const styles = [
        () => { // Sketchy Blobs
            let shapes = '';
            for (let i = 0; i < 4; i++) {
                const cx = 150 + seed(i) * 300;
                const cy = 150 + seed(i+5) * 300;
                let d = '';
                for (let a = 0; a <= 360; a += 20) {
                    const angle = (a * Math.PI) / 180;
                    const r = 40 + seed(a+i*50) * 120;
                    const x = cx + r * Math.cos(angle);
                    const y = cy + r * Math.sin(angle);
                    d += (a === 0 ? 'M' : 'L') + `${x.toFixed(1)},${y.toFixed(1)}`;
                }
                shapes += `<path d="${d}Z" fill="${accent}" opacity="0.1" stroke="${accent}" stroke-width="4" stroke-dasharray="15,5"/>`;
            }
            return shapes;
        },
        () => { // Abstract Crayon Scrawl
            let shapes = '';
            for (let i = 0; i < 15; i++) {
                const x1 = 50 + seed(i) * 500;
                const y1 = 50 + seed(i+1) * 500;
                const x2 = x1 + (seed(i+2) * 200 - 100);
                const y2 = y1 + (seed(i+3) * 200 - 100);
                shapes += `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${accent}" stroke-width="${2 + seed(i)*10}" stroke-linecap="round" opacity="0.3" />`;
            }
            return shapes;
        }
    ];

    const idx = Math.abs(hash + slideNum) % styles.length;
    return styles[idx]();
}

/**
 * Main entrance
 */
async function generateSlideImages(carouselData, outputDir) {
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🎨 IMAGE GENERATION');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━\n');

    const palette = PALETTES[Math.floor(Math.random() * PALETTES.length)];
    fs.mkdirSync(outputDir, { recursive: true });
    
    const illustrationBuffers = Array.from({ length: carouselData.slides.length }, () => null);
    const runtimeState = { 
        exhaustedGoogleKeys: new Set(), 
        exhaustedHfTokens: new Set(), 
        logged: new Set() 
    };

    // Sequential attempt for AI images (more reliable)
    for (let i = 0; i < carouselData.slides.length; i++) {
        const slide = carouselData.slides[i];
        console.log(`\n   🔍 Fetching AI illustration for slide ${i+1}...`);
        
        // 1. Gemini
        let buf = await fetchGeminiIllustration(slide.headline, palette, slide.type, runtimeState);
        if (buf) {
            illustrationBuffers[i] = buf;
            continue;
        }

        // 2. Flux
        buf = await fetchFluxIllustration(slide.headline, palette, slide.type, runtimeState);
        if (buf) {
            illustrationBuffers[i] = buf;
            continue;
        }

        // 3. Pollinations
        buf = await fetchPollinationsIllustration(slide.headline, palette, slide.type);
        if (buf) {
            illustrationBuffers[i] = buf;
            continue;
        }
        
        console.log(`      ⚠️  All AI sources failed for slide ${i+1}, using procedural.`);
    }

    const imagePaths = [];
    for (let i = 0; i < carouselData.slides.length; i++) {
        const slide = carouselData.slides[i];
        const slideNum = i + 1;
        console.log(`   Rendering slide ${slideNum}/${carouselData.slides.length}...`);
        
        const illustration = illustrationBuffers[i] 
            ? { type: 'bitmap', buffer: illustrationBuffers[i] }
            : { type: 'svg', svg: generateIllustrationSVG(slide.headline, palette, slide.type, slideNum) };
            
        const path = await generatePremiumSlide(slide, palette, outputDir, slideNum, carouselData.slides.length, '', illustration);
        imagePaths.push(path);
    }
    
    return imagePaths;
}

/**
 * Render single slide to PNG
 */
async function generatePremiumSlide(slide, palette, outputDir, slideNum, totalSlides, profileB64, illustration) {
    const headline = escapeXml(slide.headline || '');
    const body = escapeXml(slide.body || '');
    const isHook = slide.type === 'hook';
    
    // Fonts: Caveat Brush for that 'Crayon' feel, Apple stack for premium look
    const headlineFont = "'Caveat Brush', '-apple-system', 'SF Pro Display', sans-serif";
    const bodyFont = "'-apple-system', 'SF Pro Display', 'Helvetica Neue', sans-serif";
    
    let illustrationMarkup = '';
    if (illustration.type === 'bitmap' && illustration.buffer) {
        const b64 = `data:image/png;base64,${illustration.buffer.toString('base64')}`;
        // Premium large illustration
        if (isHook) {
            illustrationMarkup = `
                <rect x="520" y="220" width="500" height="500" rx="60" fill="white" opacity="0.05" />
                <image href="${b64}" x="540" y="240" width="460" height="460" opacity="0.9" clip-path="url(#illustClip)" preserveAspectRatio="xMidYMid slice" />`;
        } else {
            illustrationMarkup = `
                <rect x="600" y="100" width="400" height="400" rx="50" fill="white" opacity="0.05" />
                <image href="${b64}" x="620" y="120" width="360" height="360" opacity="0.8" clip-path="url(#illustClip)" preserveAspectRatio="xMidYMid slice" />`;
        }
    } else {
        // Procedural SVG fallback
        const svgContent = illustration.svg || '';
        illustrationMarkup = `<g transform="translate(600, 200) scale(1.6)" opacity="0.6">${svgContent}</g>`;
    }

    // Helper for rendering words with highlights
    const renderHighlights = (text, color) => {
        return text.split(/(\*[^*]+\*)/g).map(part => {
            if (part && part.startsWith('*') && part.endsWith('*')) {
                return `<tspan fill="${color}" font-weight="900">${part.slice(1, -1)}</tspan>`;
            }
            return part;
        }).join('');
    };

    const headlineLines = isHook ? wrapText(headline, 10) : wrapText(headline, 18);
    const headlineY = isHook ? 450 : 380;
    
    const headlineMarkup = headlineLines.map((line, i) => 
        `<tspan x="${isHook ? 100 : 160}" dy="${i === 0 ? 0 : (isHook ? 130 : 85)}">${renderHighlights(line, palette.accent)}</tspan>`
    ).join('');

    const bodyLines = wrapText(body, 32);
    const bodyMarkup = bodyLines.map((line, i) => 
        `<tspan x="160" dy="${i === 0 ? 0 : 65}">${line}</tspan>`
    ).join('');

    const svg = `
    <svg width="1080" height="1350" xmlns="http://www.w3.org/2000/svg">
        <defs>
            <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" style="stop-color:${palette.bg}"/>
                <stop offset="100%" style="stop-color:${palette.bg2}"/>
            </linearGradient>

            <!-- CRAYON FILTER -->
            <filter id="crayon" x="-10%" y="-10%" width="120%" height="120%">
                <feTurbulence type="fractalNoise" baseFrequency="0.03" numOctaves="4" result="noise"/>
                <feDisplacementMap in="SourceGraphic" in2="noise" scale="6" xChannelSelector="R" yChannelSelector="G" result="rough"/>
            </filter>

            <!-- PAPER TEXTURE -->
            <filter id="paper" x="0%" y="0%" width="100%" height="100%">
                <feTurbulence type="fractalNoise" baseFrequency="0.4" numOctaves="3" result="noise"/>
                <feDiffuseLighting in="noise" lighting-color="white" surfaceScale="2">
                    <feDistantLight azimuth="45" elevation="60"/>
                </feDiffuseLighting>
            </filter>

            <clipPath id="illustClip">
                <rect x="0" y="0" width="2000" height="2000" rx="80"/>
            </clipPath>
            
            <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
                <feGaussianBlur stdDeviation="120" result="blur"/>
            </filter>
        </defs>
        
        <!-- Paper Layer -->
        <rect width="1080" height="1350" fill="url(#bgGrad)"/>
        <rect width="1080" height="1350" fill="white" opacity="0.3" filter="url(#paper)"/>
        
        <circle cx="200" cy="300" r="600" fill="${palette.accent}" opacity="0.1" filter="url(#glow)"/>

        <!-- Illustrations -->
        <g filter="url(#crayon)">
            ${illustrationMarkup}
        </g>

        <!-- Main Content -->
        <g filter="url(#crayon)">
            <text x="${isHook ? 100 : 160}" y="${headlineY}" font-family="${headlineFont}" font-size="${isHook ? 110 : 65}" font-weight="900" fill="${palette.text}" letter-spacing="-1">
                ${headlineMarkup}
            </text>
            
            ${!isHook ? `
            <text x="160" y="${headlineY + (headlineLines.length * 85) + 60}" font-family="${bodyFont}" font-size="38" font-weight="500" fill="${palette.text}" opacity="0.7">
                ${bodyMarkup}
            </text>
            ` : ''}
        </g>

        <!-- Premium Details -->
        <line x1="100" y1="1240" x2="980" y2="1240" stroke="${palette.text}" opacity="0.1" stroke-width="1"/>
        
        <text x="100" y="1290" font-family="${bodyFont}" font-size="22" font-weight="800" fill="${palette.text}" opacity="0.3" letter-spacing="4">ARYAN RAJPUT</text>
        <text x="540" y="1290" font-family="${bodyFont}" font-size="26" font-weight="900" fill="${palette.accent}" text-anchor="middle">${slideNum} / ${totalSlides}</text>
        <text x="980" y="1290" font-family="${bodyFont}" font-size="22" font-weight="800" fill="${palette.accent}" text-anchor="end">SWIPE →</text>
    </svg>`;

    const imgPath = path.join(outputDir, `slide_${String(slideNum).padStart(2, '0')}.png`);
    await sharp(Buffer.from(svg)).png().toFile(imgPath);
    return imgPath;
}

function wrapText(text, max) {
    if (!text) return [];
    const words = text.split(' ');
    const lines = [];
    let cur = '';
    for (const w of words) {
        if ((cur + ' ' + w).length > max) {
            lines.push(cur.trim());
            cur = w;
        } else {
            cur += ' ' + w;
        }
    }
    lines.push(cur.trim());
    return lines;
}

function escapeXml(str) {
    return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&apos;');
}

module.exports = { generateSlideImages };
