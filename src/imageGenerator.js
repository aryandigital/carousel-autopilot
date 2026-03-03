// ============================================
// Image Generator — AI Illustration + SVG Renderer
// ============================================
// Generates stunning carousels with AI-generated illustrations

const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

// Premium color palettes — each with a unique mood
const PALETTES = [
    { name: 'midnight', bg: '#0F0F1A', accent: '#6C63FF', text: '#FFFFFF', subtle: '#8B85FF', mood: 'deep purple cosmic' },
    { name: 'ocean', bg: '#0A192F', accent: '#64FFDA', text: '#CCD6F6', subtle: '#45E0C0', mood: 'ocean teal dark' },
    { name: 'sunset', bg: '#1A0A2E', accent: '#FF6B6B', text: '#F0E6FF', subtle: '#FF8E53', mood: 'warm sunset gradient' },
    { name: 'forest', bg: '#0D1117', accent: '#7EE787', text: '#E6EDF3', subtle: '#56D364', mood: 'dark green nature' },
    { name: 'royal', bg: '#13111C', accent: '#E040FB', text: '#F3E5F5', subtle: '#CE93D8', mood: 'royal magenta neon' },
    { name: 'ember', bg: '#1C1410', accent: '#FF9800', text: '#FFF3E0', subtle: '#FFB74D', mood: 'amber fire warm' },
    { name: 'arctic', bg: '#0B1628', accent: '#00B4D8', text: '#E0F7FA', subtle: '#48CAE4', mood: 'icy blue cold' },
    { name: 'crimson', bg: '#1A0000', accent: '#FF1744', text: '#FFE0E0', subtle: '#FF5252', mood: 'deep red dramatic' },
];

/**
 * Generate a beautiful procedural SVG illustration based on slide content
 * No external API needed — creates unique abstract graphics per slide
 */
function generateIllustrationSVG(headline, palette, slideType, slideNum) {
    // Generate a hash from headline for deterministic but varied shapes
    let hash = 0;
    for (let i = 0; i < headline.length; i++) {
        hash = ((hash << 5) - hash + headline.charCodeAt(i)) | 0;
    }
    const seed = (n) => Math.abs((hash * (n + 1) * 9301 + 49297) % 233280) / 233280;

    const accent = palette.accent;
    const subtle = palette.subtle;

    // Pick an illustration style based on seed
    const styles = [
        // Style 0: Floating orbs constellation
        () => {
            let shapes = '';
            const count = 5 + Math.floor(seed(1) * 4);
            for (let i = 0; i < count; i++) {
                const cx = 60 + seed(i * 3) * 360;
                const cy = 60 + seed(i * 3 + 1) * 360;
                const r = 15 + seed(i * 3 + 2) * 45;
                const opacity = 0.15 + seed(i * 5) * 0.4;
                shapes += `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${i % 2 === 0 ? accent : subtle}" opacity="${opacity}"/>`;
                // Connect some orbs with faint lines
                if (i > 0) {
                    const px = 60 + seed((i - 1) * 3) * 360;
                    const py = 60 + seed((i - 1) * 3 + 1) * 360;
                    shapes += `<line x1="${px}" y1="${py}" x2="${cx}" y2="${cy}" stroke="${accent}" stroke-width="1" opacity="0.15"/>`;
                }
            }
            // Central glow
            shapes += `<circle cx="240" cy="240" r="120" fill="${accent}" opacity="0.08" filter="url(#glow)"/>`;
            return shapes;
        },
        // Style 1: Abstract geometric stack
        () => {
            let shapes = '';
            const rects = 4 + Math.floor(seed(10) * 3);
            for (let i = 0; i < rects; i++) {
                const x = 40 + seed(i * 4) * 200;
                const y = 40 + seed(i * 4 + 1) * 200;
                const w = 80 + seed(i * 4 + 2) * 200;
                const h = 60 + seed(i * 4 + 3) * 160;
                const rx = 8 + seed(i * 7) * 24;
                const rot = -20 + seed(i * 6) * 40;
                const opacity = 0.1 + seed(i * 8) * 0.25;
                shapes += `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${rx}" fill="${i % 2 === 0 ? accent : subtle}" opacity="${opacity}" transform="rotate(${rot}, ${x + w / 2}, ${y + h / 2})"/>`;
            }
            // Diamond accent
            shapes += `<polygon points="240,80 340,240 240,400 140,240" fill="none" stroke="${accent}" stroke-width="2" opacity="0.2"/>`;
            return shapes;
        },
        // Style 2: Concentric rings
        () => {
            let shapes = '';
            for (let i = 0; i < 5; i++) {
                const r = 40 + i * 40;
                const dashLen = 10 + seed(i * 2) * 30;
                shapes += `<circle cx="240" cy="240" r="${r}" fill="none" stroke="${i % 2 === 0 ? accent : subtle}" stroke-width="${2 + seed(i) * 3}" stroke-dasharray="${dashLen} ${dashLen * 0.8}" opacity="${0.12 + seed(i * 3) * 0.2}" transform="rotate(${seed(i * 5) * 360}, 240, 240)"/>`;
            }
            // Center dot
            shapes += `<circle cx="240" cy="240" r="12" fill="${accent}" opacity="0.6"/>`;
            shapes += `<circle cx="240" cy="240" r="6" fill="#fff" opacity="0.8"/>`;
            return shapes;
        },
        // Style 3: Mesh grid with glow nodes
        () => {
            let shapes = '';
            const cols = 4, rows = 4;
            const points = [];
            for (let r = 0; r < rows; r++) {
                for (let c = 0; c < cols; c++) {
                    const x = 60 + c * 120 + (seed(r * cols + c) - 0.5) * 40;
                    const y = 60 + r * 120 + (seed(r * cols + c + 20) - 0.5) * 40;
                    points.push({ x, y });
                }
            }
            // Draw connections
            for (let i = 0; i < points.length; i++) {
                for (let j = i + 1; j < points.length; j++) {
                    const dist = Math.hypot(points[i].x - points[j].x, points[i].y - points[j].y);
                    if (dist < 180) {
                        shapes += `<line x1="${points[i].x}" y1="${points[i].y}" x2="${points[j].x}" y2="${points[j].y}" stroke="${accent}" stroke-width="1" opacity="${0.08 + (1 - dist / 180) * 0.12}"/>`;
                    }
                }
            }
            // Draw nodes
            for (let i = 0; i < points.length; i++) {
                const r = 4 + seed(i * 9) * 10;
                shapes += `<circle cx="${points[i].x}" cy="${points[i].y}" r="${r}" fill="${i % 3 === 0 ? accent : subtle}" opacity="${0.3 + seed(i * 7) * 0.4}"/>`;
            }
            return shapes;
        },
        // Style 4: Rising bars / chart-like
        () => {
            let shapes = '';
            const bars = 6 + Math.floor(seed(15) * 3);
            const barW = 360 / bars;
            for (let i = 0; i < bars; i++) {
                const h = 60 + seed(i * 2) * 300;
                const x = 60 + i * barW;
                const y = 420 - h;
                const rx = 8;
                shapes += `<rect x="${x}" y="${y}" width="${barW * 0.7}" height="${h}" rx="${rx}" fill="${i % 2 === 0 ? accent : subtle}" opacity="${0.15 + seed(i * 3) * 0.25}"/>`;
            }
            // Trend line
            let pathD = '';
            for (let i = 0; i < bars; i++) {
                const x = 60 + i * barW + barW * 0.35;
                const h = 60 + seed(i * 2) * 300;
                const y = 420 - h - 10;
                pathD += `${i === 0 ? 'M' : 'L'} ${x} ${y} `;
            }
            shapes += `<path d="${pathD}" fill="none" stroke="${accent}" stroke-width="3" opacity="0.4" stroke-linecap="round" stroke-linejoin="round"/>`;
            return shapes;
        },
    ];

    const styleIdx = Math.abs(hash + slideNum) % styles.length;
    return styles[styleIdx]();
}

/**
 * Fetch an AI-generated illustration from Hugging Face Inference API (FLUX)
 * Returns a Buffer of the PNG image, or null on failure
 */
async function fetchFluxIllustration(headline, palette, slideType) {
    const hfToken = process.env.HF_TOKEN;
    if (!hfToken) return null;

    try {
        // Build a focused prompt for the illustration
        let subjectHint = headline.replace(/[^a-zA-Z0-9\s]/g, '').slice(0, 60);
        const styleHints = [
            'minimalist 3D illustration',
            'clean dark background',
            'professional modern aesthetic',
            `${palette.mood} color scheme`,
            'no text no typography',
            'centered single iconic object',
            'high quality digital art render',
        ];
        if (slideType === 'hook') {
            styleHints.push('dramatic hero shot', 'eye-catching vibrant');
        } else if (slideType === 'cta') {
            styleHints.push('upward motion', 'growth symbol');
        }

        const prompt = `${subjectHint}, ${styleHints.join(', ')}`;

        const res = await fetch('https://router.huggingface.co/hf-inference/models/black-forest-labs/FLUX.1-schnell', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${hfToken}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ inputs: prompt }),
        });

        if (!res.ok) {
            const errText = await res.text();
            console.log(`      ⚠️  Hugging Face returned ${res.status}: ${errText.slice(0, 80)}`);
            return null;
        }

        const arrayBuffer = await res.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        if (buffer.length < 1000) {
            console.log('      ⚠️  Hugging Face returned invalid image data (too small)');
            return null;
        }

        console.log(`      ✅ FLUX illustration received (${Math.round(buffer.length / 1024)}KB)`);
        return buffer;
    } catch (err) {
        console.log(`      ⚠️  FLUX illustration failed: ${err.message}`);
        return null;
    }
}

/**
 * Generate carousel slide images with AI illustrations (Hugging Face FLUX) + SVG fallback
 */
async function generateSlideImages(carouselData, outputDir) {
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🎨 IMAGE GENERATION');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━\n');

    const palette = PALETTES[Math.floor(Math.random() * PALETTES.length)];
    console.log(`   Using premium "${palette.name}" color palette (${palette.mood})`);

    fs.mkdirSync(outputDir, { recursive: true });
    const imagePaths = [];

    // Load profile pic as base64
    let profileB64 = '';
    const profilePath = path.join(__dirname, '..', 'src', 'assets', 'profile.jpg');
    try {
        if (fs.existsSync(profilePath)) {
            const img = fs.readFileSync(profilePath);
            profileB64 = `data:image/jpeg;base64,${img.toString('base64')}`;
        }
    } catch (e) {
        console.warn('   ⚠️  Profile picture not found at src/assets/profile.jpg');
    }

    // Pre-fetch AI illustrations from Hugging Face FLUX in batches of 3
    const useFlux = !!process.env.HF_TOKEN;
    const illustrationBuffers = Array.from({ length: carouselData.slides.length }, () => null);

    if (useFlux) {
        console.log('\n   📦 Generating AI illustrations with FLUX.1 Schnell...\n');
        for (let batch = 0; batch < carouselData.slides.length; batch += 3) {
            const batchSlides = carouselData.slides.slice(batch, batch + 3);
            const batchPromises = batchSlides.map((slide, idx) =>
                fetchFluxIllustration(
                    slide.headline || slide.body || carouselData.topic,
                    palette, slide.type
                ).then(buf => { illustrationBuffers[batch + idx] = buf; })
            );
            await Promise.all(batchPromises);
            // Small delay between batches to avoid rate limits
            if (batch + 3 < carouselData.slides.length) {
                await new Promise(r => setTimeout(r, 500));
            }
        }
    }

    for (const slide of carouselData.slides) {
        const slideNum = slide.slideNumber;
        console.log(`   Generating slide ${slideNum}/${carouselData.slides.length}...`);

        try {
            const illustrationBuf = illustrationBuffers[slideNum - 1];
            let illustrationMarkupOrSVG;

            if (illustrationBuf) {
                // Use AI-generated FLUX illustration as base64 image
                illustrationMarkupOrSVG = { type: 'bitmap', buffer: illustrationBuf };
            } else {
                // Fallback to procedural SVG
                illustrationMarkupOrSVG = {
                    type: 'svg',
                    svg: generateIllustrationSVG(
                        slide.headline || slide.body || carouselData.topic,
                        palette, slide.type, slideNum
                    )
                };
            }

            const imagePath = await generatePremiumSlide(
                slide, palette, outputDir, slideNum,
                carouselData.slides.length, profileB64, illustrationMarkupOrSVG
            );
            imagePaths.push(imagePath);
            console.log(`   ✅ Slide ${slideNum} rendered and saved`);
        } catch (err) {
            console.error(`   ❌ Slide ${slideNum} generation failed: ${err.message}`);
        }
    }

    console.log(`\n   ✅ Generated ${imagePaths.length} premium slide images`);
    return imagePaths;
}

/**
 * Generate a stunning high-quality slide using SVG with AI or procedural illustration
 */
async function generatePremiumSlide(slide, palette, outputDir, slideNum, totalSlides, profileB64, illustration) {
    const headline = escapeXml(slide.headline || '');
    const body = escapeXml(slide.body || '');
    const isHook = slide.type === 'hook';
    const isCta = slide.type === 'cta';

    const fontString = "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif";

    // Build illustration markup based on type (bitmap from FLUX or procedural SVG)
    let illustrationMarkup = '';
    if (illustration) {
        if (illustration.type === 'bitmap' && illustration.buffer) {
            // AI-generated FLUX illustration — embed as base64 image
            const b64 = `data:image/png;base64,${illustration.buffer.toString('base64')}`;
            if (isHook) {
                illustrationMarkup = `
                    <image href="${b64}" x="560" y="60" width="480" height="480"
                           opacity="0.85" preserveAspectRatio="xMidYMid slice"
                           clip-path="url(#illustClip)" filter="url(#illustGlow)" />`;
            } else {
                illustrationMarkup = `
                    <image href="${b64}" x="620" y="100" width="400" height="400"
                           opacity="0.6" preserveAspectRatio="xMidYMid slice"
                           clip-path="url(#illustClip)" filter="url(#illustGlow)" />`;
            }
        } else if (illustration.type === 'svg' && illustration.svg) {
            // Procedural SVG fallback
            if (isHook) {
                illustrationMarkup = `<g transform="translate(560, 60) scale(1.0)" opacity="0.7" filter="url(#illustGlow)">${illustration.svg}</g>`;
            } else {
                illustrationMarkup = `<g transform="translate(620, 100) scale(0.85)" opacity="0.5" filter="url(#illustGlow)">${illustration.svg}</g>`;
            }
        }
    }

    // Build text content
    let headlineMarkup = '';
    let bodyMarkup = '';

    if (isHook) {
        const headlineLines = wrapText(headline, 16);
        headlineMarkup = headlineLines
            .map((line, i) => {
                const color = i === Math.floor(headlineLines.length / 2) ? palette.accent : '#ffffff';
                return `<tspan x="120" dy="${i === 0 ? 0 : 90}" fill="${color}">${line}</tspan>`;
            }).join('\n');

        headlineMarkup = `<text x="120" y="450" font-family="${fontString}" font-size="76" font-weight="900" fill="#ffffff" letter-spacing="-1">${headlineMarkup}</text>`;
    } else {
        const headlineLines = wrapText(headline, 30);
        const cardY = 300;
        let currentY = cardY + 120;

        headlineMarkup = headlineLines
            .map((line, i) => `<tspan x="160" dy="${i === 0 ? 0 : 60}">${line}</tspan>`)
            .join('\n');

        headlineMarkup = `<text x="160" y="${currentY}" font-family="${fontString}" font-size="44" font-weight="bold" fill="${palette.accent}">${headlineMarkup}</text>`;

        currentY += (headlineLines.length * 60) + 40;

        if (body) {
            const bodyLines = wrapText(body, 36);
            bodyMarkup = bodyLines
                .map((line, i) => `<tspan x="160" dy="${i === 0 ? 0 : 50}">${line}</tspan>`)
                .join('\n');
            bodyMarkup = `<text x="160" y="${currentY}" font-family="${fontString}" font-size="34" font-weight="400" fill="rgba(255,255,255,0.9)" line-height="1.6">${bodyMarkup}</text>`;
        }
    }

    const swipeText = slideNum < totalSlides
        ? `<rect x="800" y="1270" width="160" height="40" rx="20" fill="${palette.accent}" opacity="0.1"/>
           <text x="880" y="1296" font-family="${fontString}" font-size="20" font-weight="bold" fill="${palette.accent}" text-anchor="middle">SWIPE →</text>`
        : `<rect x="800" y="1270" width="160" height="40" rx="20" fill="${palette.accent}" opacity="0.1"/>
           <text x="880" y="1296" font-family="${fontString}" font-size="20" font-weight="bold" fill="${palette.accent}" text-anchor="middle">FOLLOW +</text>`;

    const imageTag = profileB64
        ? `<image href="${profileB64}" x="120" y="80" height="80" width="80" clip-path="url(#profileClip)" preserveAspectRatio="xMidYMid slice" />`
        : `<circle cx="160" cy="120" r="40" fill="rgba(255,255,255,0.1)" />`;

    const cardHtml = (!isHook)
        ? `<rect x="100" y="300" width="880" height="700" rx="32" fill="rgba(255,255,255,0.03)" stroke="rgba(255,255,255,0.1)" stroke-width="2"/>`
        : '';

    const svg = `<svg width="1080" height="1350" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
        <defs>
            <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" style="stop-color:${palette.bg}"/>
                <stop offset="100%" style="stop-color:#05050A"/>
            </linearGradient>
            
            <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
                <feGaussianBlur stdDeviation="150" result="blur" />
            </filter>

            <filter id="illustGlow" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur in="SourceAlpha" stdDeviation="20" result="blur"/>
                <feFlood flood-color="${palette.accent}" flood-opacity="0.3" result="color"/>
                <feComposite in="color" in2="blur" operator="in" result="glow"/>
                <feMerge>
                    <feMergeNode in="glow"/>
                    <feMergeNode in="SourceGraphic"/>
                </feMerge>
            </filter>
            
            <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                <path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgba(255,255,255,0.02)" stroke-width="1"/>
            </pattern>
            
            <clipPath id="profileClip">
                <circle cx="160" cy="120" r="40" />
            </clipPath>

            <clipPath id="illustClip">
                <rect x="560" y="60" width="480" height="480" rx="40" />
            </clipPath>
        </defs>

        <!-- Background -->
        <rect width="1080" height="1350" fill="url(#bgGrad)"/>
        <circle cx="100" cy="200" r="450" fill="${palette.accent}" opacity="0.12" filter="url(#glow)"/>
        <circle cx="900" cy="1100" r="500" fill="${palette.subtle}" opacity="0.1" filter="url(#glow)"/>
        <rect width="1080" height="1350" fill="url(#grid)" />
        
        <!-- AI Illustration -->
        ${illustrationMarkup}
        
        <!-- Header -->
        ${imageTag}
        <text x="220" y="115" font-family="${fontString}" font-size="28" font-weight="bold" fill="#ffffff">Aryan Rajput</text>
        <text x="220" y="145" font-family="${fontString}" font-size="20" fill="rgba(255,255,255,0.6)">@aryanrajput</text>
        
        <rect x="830" y="95" width="130" height="50" rx="25" fill="rgba(255,255,255,0.05)" stroke="rgba(255,255,255,0.1)" stroke-width="1"/>
        <text x="895" y="128" font-family="monospace" font-size="20" font-weight="bold" fill="${palette.accent}" text-anchor="middle" letter-spacing="2">${String(slideNum).padStart(2, '0')} / ${String(totalSlides).padStart(2, '0')}</text>

        <!-- Main Content Area -->
        ${cardHtml}
        ${headlineMarkup}
        ${bodyMarkup}

        <!-- Footer -->
        <line x1="120" y1="1250" x2="960" y2="1250" stroke="rgba(255,255,255,0.1)" stroke-width="2" />
        <text x="120" y="1300" font-family="${fontString}" font-size="20" font-weight="600" fill="rgba(255,255,255,0.4)" letter-spacing="2" text-transform="uppercase">Daily Insights</text>
        ${swipeText}
    </svg>`;

    const imagePath = path.join(outputDir, `slide_${String(slideNum).padStart(2, '0')}.png`);
    await sharp(Buffer.from(svg)).png().toFile(imagePath);
    return imagePath;
}

function wrapText(text, maxCharsPerLine) {
    if (!text) return [];
    const words = text.split(' ');
    const lines = [];
    let currentLine = '';

    for (const word of words) {
        if ((currentLine + ' ' + word).trim().length > maxCharsPerLine) {
            if (currentLine) lines.push(currentLine.trim());
            currentLine = word;
        } else {
            currentLine += ' ' + word;
        }
    }
    if (currentLine.trim()) lines.push(currentLine.trim());
    return lines;
}

function escapeXml(str) {
    return str
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&apos;');
}

module.exports = { generateSlideImages };
