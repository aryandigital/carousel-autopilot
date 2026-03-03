// ============================================
// Image Generator — Premium SVG Renderer
// ============================================
// Generates stunning, text-perfect SVG carousels

const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

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
 * Generate carousel slide images using Premium SVG templates
 */
async function generateSlideImages(carouselData, outputDir) {
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🎨 IMAGE GENERATION');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━\n');

    const palette = PALETTES[Math.floor(Math.random() * PALETTES.length)];
    console.log(`   Using premium "${palette.name}" color palette`);

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

    for (const slide of carouselData.slides) {
        const slideNum = slide.slideNumber;
        console.log(`   Generating slide ${slideNum}/${carouselData.slides.length}...`);

        try {
            const imagePath = await generatePremiumSlide(slide, palette, outputDir, slideNum, carouselData.slides.length, profileB64);
            imagePaths.push(imagePath);
            console.log(`   ✅ Slide ${slideNum} rendered and saved`);
        } catch (err) {
            console.error(`   ❌ Slide ${slideNum} generation failed: ${err.message}`);
        }
    }

    console.log(`\n   ✅ Generated ${imagePaths.length} premium slide images`);
    return imagePaths;
}

function getIsolated3DShape(palette, type = 0) {
    if (type === 0) {
        // Isometric 3D Glass Cube
        return `
        <g transform="translate(850, 250) scale(1.5)">
            <defs>
                <linearGradient id="cubeTop" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" style="stop-color:${palette.accent};stop-opacity:0.9"/>
                    <stop offset="100%" style="stop-color:${palette.accent};stop-opacity:0.4"/>
                </linearGradient>
                <linearGradient id="cubeLeft" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" style="stop-color:${palette.subtle};stop-opacity:0.8"/>
                    <stop offset="100%" style="stop-color:${palette.subtle};stop-opacity:0.2"/>
                </linearGradient>
                <linearGradient id="cubeRight" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" style="stop-color:#ffffff;stop-opacity:0.15"/>
                    <stop offset="100%" style="stop-color:#ffffff;stop-opacity:0.0"/>
                </linearGradient>
                <filter id="cubeDropShadow" x="-20%" y="-20%" width="150%" height="150%">
                    <feDropShadow dx="0" dy="30" stdDeviation="20" flood-color="${palette.bg}" flood-opacity="0.8"/>
                </filter>
            </defs>
            <g filter="url(#cubeDropShadow)">
                <!-- Left Face -->
                <path d="M 0 0 L -60 30 L -60 90 L 0 60 Z" fill="url(#cubeLeft)" stroke="rgba(255,255,255,0.2)" stroke-width="1"/>
                <!-- Right Face -->
                <path d="M 0 0 L 60 30 L 60 90 L 0 60 Z" fill="url(#cubeRight)" stroke="rgba(255,255,255,0.2)" stroke-width="1"/>
                <!-- Top Face -->
                <path d="M 0 0 L -60 30 L 0 60 L 60 30 Z" transform="translate(0, -60)" fill="url(#cubeTop)" stroke="rgba(255,255,255,0.4)" stroke-width="1"/>
            </g>
        </g>`;
    } else {
        // Floating 3D Spline Sphere
        return `
        <g transform="translate(850, 250) scale(1.5)">
            <defs>
                <radialGradient id="sphereGrad" cx="30%" cy="30%" r="70%">
                    <stop offset="0%" style="stop-color:#ffffff;stop-opacity:0.9"/>
                    <stop offset="30%" style="stop-color:${palette.accent};stop-opacity:0.8"/>
                    <stop offset="100%" style="stop-color:${palette.bg};stop-opacity:0.1"/>
                </radialGradient>
                <filter id="sphereGlow" x="-50%" y="-50%" width="200%" height="200%">
                    <feDropShadow dx="20" dy="40" stdDeviation="25" flood-color="${palette.bg}" flood-opacity="0.9"/>
                </filter>
            </defs>
            <circle cx="0" cy="0" r="70" fill="url(#sphereGrad)" filter="url(#sphereGlow)" stroke="rgba(255,255,255,0.3)" stroke-width="1.5"/>
            <ellipse cx="-15" cy="-25" rx="20" ry="10" transform="rotate(-30 -15 -25)" fill="#ffffff" opacity="0.6"/>
        </g>`;
    }
}

/**
 * Generate a stunning high-quality slide using SVG
 */
async function generatePremiumSlide(slide, palette, outputDir, slideNum, totalSlides, profileB64) {
    const headline = escapeXml(slide.headline || '');
    const body = escapeXml(slide.body || '');
    const isHook = slide.type === 'hook';
    const isCta = slide.type === 'cta';

    // Break text into lines
    let headlineMarkup = '';
    let bodyMarkup = '';

    const fontString = "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif";

    // Select dynamic isolated Lucide icon for this slide
    let isolatedGraphic = '';
    const iconName = slide.icon || 'zap';
    try {
        const fetch = global.fetch || require('node-fetch');
        const res = await fetch(`https://api.iconify.design/lucide/${iconName}.svg`);
        if (res.ok) {
            const svgText = await res.text();
            const match = svgText.match(/<svg[^>]*>([\s\S]*?)<\/svg>/);
            if (match && match[1]) {
                // Lucide icons are 24x24. We scale them by 20 to 480x480.
                // We use stroke-width 1.2 so it remains elegant at scale.
                isolatedGraphic = `
                <g transform="translate(680, 150) scale(20)" opacity="0.15">
                    <g fill="none" stroke="${palette.accent}" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round" filter="url(#glow)">
                        ${match[1]}
                    </g>
                </g>`;
            }
        }
    } catch (e) {
        console.warn(`   ⚠️  Failed to fetch icon '${iconName}'. Using fallback.`);
    }

    // Fallback to our custom 3D geometric shapes if the fetch fails or icon doesn't exist
    if (!isolatedGraphic) {
        isolatedGraphic = getIsolated3DShape(palette, slideNum % 2);
    }

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

    const svg = `<svg width="1080" height="1350" xmlns="http://www.w3.org/2000/svg">
        <defs>
            <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" style="stop-color:${palette.bg}"/>
                <stop offset="100%" style="stop-color:#05050A"/>
            </linearGradient>
            
            <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
                <feGaussianBlur stdDeviation="150" result="blur" />
            </filter>
            
            <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                <path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgba(255,255,255,0.02)" stroke-width="1"/>
            </pattern>
            
            <clipPath id="profileClip">
                <circle cx="160" cy="120" r="40" />
            </clipPath>
        </defs>

        <!-- Background -->
        <rect width="1080" height="1350" fill="url(#bgGrad)"/>
        <circle cx="100" cy="200" r="450" fill="${palette.accent}" opacity="0.12" filter="url(#glow)"/>
        <circle cx="900" cy="1100" r="500" fill="${palette.subtle}" opacity="0.1" filter="url(#glow)"/>
        <rect width="1080" height="1350" fill="url(#grid)" />
        
        <!-- Dynamic Isolated Graphic -->
        ${isolatedGraphic}
        
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
