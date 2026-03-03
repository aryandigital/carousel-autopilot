// ============================================
// Image Generator — Google Gemini (Nano Banana)
// ============================================
// Uses Gemini 2.0 Flash's native image generation

const { GoogleGenerativeAI } = require('@google/generative-ai');
const fs = require('fs');
const path = require('path');

// Premium color palettes for carousel slides
const PALETTES = [
    { name: 'midnight', bg: '#0F0F1A', accent: '#6C63FF', text: '#FFFFFF', subtle: '#8B85FF' },
    { name: 'ocean', bg: '#0A192F', accent: '#64FFDA', text: '#CCD6F6', subtle: '#45E0C0' },
    { name: 'sunset', bg: '#1A0A2E', accent: '#FF6B6B', text: '#F0E6FF', subtle: '#FF8E53' },
    { name: 'forest', bg: '#0D1117', accent: '#7EE787', text: '#E6EDF3', subtle: '#56D364' },
    { name: 'royal', bg: '#13111C', accent: '#E040FB', text: '#F3E5F5', subtle: '#CE93D8' },
    { name: 'ember', bg: '#1C1410', accent: '#FF9800', text: '#FFF3E0', subtle: '#FFB74D' },
];

/**
 * Generate carousel slide images using Gemini image generation
 * @param {Object} carouselData - Structured copy JSON from copywriter
 * @param {string} outputDir - Directory to save images
 * @returns {Promise<string[]>} Array of image file paths
 */
async function generateSlideImages(carouselData, outputDir) {
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🎨 IMAGE GENERATION');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━\n');

    const apiKey = process.env.GOOGLE_AI_API_KEY;
    if (!apiKey) throw new Error('GOOGLE_AI_API_KEY not set in .env');

    const genAI = new GoogleGenerativeAI(apiKey);

    // Use Gemini 2.0 Flash for image generation (Nano Banana)
    const model = genAI.getGenerativeModel({
        model: 'gemini-2.0-flash-exp',
        generationConfig: {
            responseModalities: ['image', 'text'],
        },
    });

    // Pick a random palette for consistency across slides
    const palette = PALETTES[Math.floor(Math.random() * PALETTES.length)];
    console.log(`   Using "${palette.name}" color palette`);

    fs.mkdirSync(outputDir, { recursive: true });

    const imagePaths = [];

    for (const slide of carouselData.slides) {
        const slideNum = slide.slideNumber;
        console.log(`   Generating slide ${slideNum}/${carouselData.slides.length}...`);

        const prompt = buildSlidePrompt(slide, palette, carouselData.topic);

        try {
            const result = await model.generateContent(prompt);
            const response = result.response;

            // Extract image from response
            let imageData = null;
            if (response.candidates && response.candidates[0]) {
                const parts = response.candidates[0].content.parts;
                for (const part of parts) {
                    if (part.inlineData) {
                        imageData = part.inlineData;
                        break;
                    }
                }
            }

            if (imageData) {
                const imagePath = path.join(outputDir, `slide_${String(slideNum).padStart(2, '0')}.png`);
                const buffer = Buffer.from(imageData.data, 'base64');
                fs.writeFileSync(imagePath, buffer);
                imagePaths.push(imagePath);
                console.log(`   ✅ Slide ${slideNum} saved`);
            } else {
                console.warn(`   ⚠️  No image in response for slide ${slideNum}, using fallback`);
                const fallbackPath = await generateFallbackSlide(slide, palette, outputDir, slideNum);
                imagePaths.push(fallbackPath);
            }

            // Rate limit: wait between generations
            await new Promise((r) => setTimeout(r, 2000));
        } catch (err) {
            console.error(`   ❌ Slide ${slideNum} generation failed: ${err.message}`);
            const fallbackPath = await generateFallbackSlide(slide, palette, outputDir, slideNum);
            imagePaths.push(fallbackPath);
        }
    }

    console.log(`\n   ✅ Generated ${imagePaths.length} slide images`);
    return imagePaths;
}

/**
 * Build a detailed image generation prompt for a slide
 */
function buildSlidePrompt(slide, palette, topic) {
    const isHook = slide.type === 'hook';
    const isCta = slide.type === 'cta';

    let designInstructions = '';

    if (isHook) {
        designInstructions = `Create a stunning LinkedIn carousel COVER SLIDE with these specifications:
- Dimensions: Portrait orientation (1080x1350 pixels ratio)
- Background: Rich dark gradient using ${palette.bg} with subtle geometric patterns or abstract shapes
- Main headline text: "${slide.headline}" — displayed in LARGE, bold, modern sans-serif typography (like Inter or Montserrat), color ${palette.accent}
- The text should be the hero element, centered and commanding
- Add a subtle "Swipe →" indicator at the bottom in ${palette.subtle}
- Add subtle decorative elements: thin lines, dots, or abstract geometric shapes in ${palette.accent} with low opacity
- Style: Premium, modern, clean — like a high-end design agency
- NO photos of people, NO stock imagery — pure typography and design elements
- The overall feel should be BOLD, STRIKING, and PROFESSIONAL`;
    } else if (isCta) {
        designInstructions = `Create a LinkedIn carousel CTA (Call to Action) SLIDE:
- Dimensions: Portrait orientation (1080x1350 pixels ratio)
- Background: Gradient from ${palette.bg} to a slightly lighter shade
- Headline: "${slide.headline}" in bold ${palette.accent} colored text
- Body text: "${slide.body || ''}" in clean ${palette.text} colored text
- Add a visual CTA button or highlighted box area
- Include social engagement icons subtly (like, comment, share symbols)
- Style: Clean, premium, inviting — makes people want to engage
- NO photos — typography and design elements only`;
    } else {
        designInstructions = `Create a LinkedIn carousel CONTENT SLIDE:
- Dimensions: Portrait orientation (1080x1350 pixels ratio)
- Background: Solid ${palette.bg} with very subtle texture or gradient
- Headline: "${slide.headline}" in bold ${palette.accent} text at the top
- Body content: "${slide.body || ''}" — displayed in clean, readable ${palette.text} text
- Use clear visual hierarchy: headline > body > supporting elements
- If there are bullet points or numbers, make them visually distinct with ${palette.accent} colored markers
- Add subtle decorative elements on the edges (thin lines, corner accents in ${palette.subtle})
- Style: Clean, minimal, easy to read — like a premium presentation slide
- NO photos — pure typography and geometric design elements`;
    }

    return `${designInstructions}

CRITICAL REQUIREMENTS:
- The text MUST be perfectly readable and spelled correctly
- Use premium modern typography — clean sans-serif fonts
- The design should look like it was made by a professional carousel designer
- Topic context: "${topic}"
- This is slide ${slide.slideNumber} of a LinkedIn carousel series`;
}

/**
 * Generate a fallback slide using SVG when AI image generation fails
 */
async function generateFallbackSlide(slide, palette, outputDir, slideNum) {
    const sharp = require('sharp');

    const headline = escapeXml(slide.headline || '');
    const body = escapeXml(slide.body || '');
    const isHook = slide.type === 'hook';
    const isCta = slide.type === 'cta';

    // Break text into lines for SVG
    const headlineLines = wrapText(headline, isHook ? 20 : 28);
    const bodyLines = wrapText(body, 38);

    const headlineFontSize = isHook ? 64 : 48;
    const bodyFontSize = 28;
    const headlineY = isHook ? 450 : 200;
    const bodyY = headlineY + headlineLines.length * (headlineFontSize + 12) + 60;

    const headlineMarkup = headlineLines
        .map((line, i) => `<text x="540" y="${headlineY + i * (headlineFontSize + 12)}" 
      font-family="Arial, Helvetica, sans-serif" font-size="${headlineFontSize}" font-weight="bold"
      fill="${palette.accent}" text-anchor="middle">${line}</text>`)
        .join('\n');

    const bodyMarkup = bodyLines
        .map((line, i) => `<text x="540" y="${bodyY + i * (bodyFontSize + 10)}" 
      font-family="Arial, Helvetica, sans-serif" font-size="${bodyFontSize}" font-weight="400"
      fill="${palette.text}" text-anchor="middle">${line}</text>`)
        .join('\n');

    const swipeText = isHook
        ? `<text x="540" y="1250" font-family="Arial" font-size="24" fill="${palette.subtle}" text-anchor="middle" opacity="0.7">Swipe →</text>`
        : '';

    const ctaBox = isCta
        ? `<rect x="240" y="${bodyY + bodyLines.length * 38 + 40}" width="600" height="70" rx="35" fill="${palette.accent}" opacity="0.9"/>
       <text x="540" y="${bodyY + bodyLines.length * 38 + 83}" font-family="Arial" font-size="24" font-weight="bold" fill="${palette.bg}" text-anchor="middle">Follow for More 🚀</text>`
        : '';

    const svg = `<svg width="1080" height="1350" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" style="stop-color:${palette.bg}"/>
        <stop offset="100%" style="stop-color:${lightenColor(palette.bg, 15)}"/>
      </linearGradient>
    </defs>
    <rect width="1080" height="1350" fill="url(#bg)"/>
    <!-- Decorative elements -->
    <circle cx="100" cy="100" r="200" fill="${palette.accent}" opacity="0.03"/>
    <circle cx="980" cy="1250" r="300" fill="${palette.subtle}" opacity="0.03"/>
    <line x1="80" y1="80" x2="80" y2="180" stroke="${palette.accent}" stroke-width="3" opacity="0.3"/>
    <line x1="80" y1="80" x2="180" y2="80" stroke="${palette.accent}" stroke-width="3" opacity="0.3"/>
    <line x1="1000" y1="1270" x2="1000" y2="1170" stroke="${palette.accent}" stroke-width="3" opacity="0.3"/>
    <line x1="1000" y1="1270" x2="900" y2="1270" stroke="${palette.accent}" stroke-width="3" opacity="0.3"/>
    <!-- Slide number -->
    <text x="540" y="120" font-family="Arial" font-size="18" fill="${palette.subtle}" text-anchor="middle" opacity="0.5">
      ${String(slideNum).padStart(2, '0')}
    </text>
    <!-- Watermark -->
    <text x="540" y="1315" font-family="Arial, Helvetica, sans-serif" font-size="22" font-weight="bold" fill="${palette.subtle}" text-anchor="middle" opacity="0.6">
      @aryanrajput
    </text>
    <!-- Content -->
    ${headlineMarkup}
    ${bodyMarkup}
    ${swipeText}
    ${ctaBox}
  </svg>`;

    const imagePath = path.join(outputDir, `slide_${String(slideNum).padStart(2, '0')}.png`);
    await sharp(Buffer.from(svg)).png().toFile(imagePath);
    console.log(`   ↪ Fallback slide ${slideNum} generated`);
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

function lightenColor(hex, percent) {
    const num = parseInt(hex.replace('#', ''), 16);
    const r = Math.min(255, (num >> 16) + percent);
    const g = Math.min(255, ((num >> 8) & 0x00ff) + percent);
    const b = Math.min(255, (num & 0x0000ff) + percent);
    return `#${(r << 16 | g << 8 | b).toString(16).padStart(6, '0')}`;
}

module.exports = { generateSlideImages };
