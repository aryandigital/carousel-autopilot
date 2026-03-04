const sharp = require('sharp');
const fs = require('fs');

async function buildTestSvg() {
    const palette = { name: 'midnight', bg: '#0F0F1A', accent: '#6C63FF', text: '#FFFFFF', subtle: '#8B85FF' };

    // Load profile pic as base64
    let profileB64 = '';
    try {
        const img = fs.readFileSync('src/assets/profile.jpg');
        profileB64 = `data:image/jpeg;base64,${img.toString('base64')}`;
    } catch (e) { }

    const svg = `<svg width="1080" height="1350" xmlns="http://www.w3.org/2000/svg">
        <defs>
            <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" style="stop-color:${palette.bg}"/>
                <stop offset="100%" style="stop-color:#05050A"/>
            </linearGradient>
            
            <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
                <feGaussianBlur stdDeviation="120" result="blur" />
            </filter>
            
            <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                <path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgba(255,255,255,0.03)" stroke-width="1"/>
            </pattern>
            
            <clipPath id="profileClip">
                <circle cx="160" cy="120" r="40" />
            </clipPath>
            
            <filter id="glass">
                <feGaussianBlur in="SourceGraphic" stdDeviation="15" result="blur" />
                <feColorMatrix type="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 18 -7" result="glow" />
                <feBlend in="SourceGraphic" in2="glow" mode="normal" />
            </filter>
        </defs>

        <!-- Background -->
        <rect width="1080" height="1350" fill="url(#bgGrad)"/>
        
        <!-- Glowing Orbs -->
        <circle cx="100" cy="200" r="400" fill="${palette.accent}" opacity="0.15" filter="url(#glow)"/>
        <circle cx="900" cy="1100" r="400" fill="${palette.subtle}" opacity="0.12" filter="url(#glow)"/>
        
        <!-- Grid overlay -->
        <rect width="1080" height="1350" fill="url(#grid)" />
        
        <!-- Header: Profile & Name -->
        <image href="${profileB64}" x="120" y="80" height="80" width="80" clip-path="url(#profileClip)" preserveAspectRatio="xMidYMid slice" />
        <text x="220" y="115" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif" font-size="28" font-weight="bold" fill="#ffffff">Aryan Rajput</text>
        <text x="220" y="145" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif" font-size="20" fill="rgba(255,255,255,0.6)">@aryanrajput</text>
        
        <!-- Header: Slide Number Pill -->
        <rect x="840" y="95" width="120" height="50" rx="25" fill="rgba(255,255,255,0.05)" stroke="rgba(255,255,255,0.1)" stroke-width="1"/>
        <text x="900" y="128" font-family="monospace" font-size="20" font-weight="bold" fill="${palette.accent}" text-anchor="middle" letter-spacing="2">01 / 09</text>

        <!-- Hook Layout (Left-aligned, massive) -->
        <text x="120" y="450" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif" font-size="76" font-weight="900" fill="#ffffff" letter-spacing="-1">
            <tspan x="120" dy="0">5 Alarming</tspan>
            <tspan x="120" dy="90">Reasons to</tspan>
            <tspan x="120" dy="90" fill="${palette.accent}">Cancel ChatGPT</tspan>
            <tspan x="120" dy="90">Now.</tspan>
        </text>

        <!-- Footer -->
        <rect x="0" y="1200" width="1080" height="2" fill="url(#bgGrad)" />
        <line x1="120" y1="1250" x2="960" y2="1250" stroke="rgba(255,255,255,0.1)" stroke-width="2" />
        <text x="120" y="1300" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif" font-size="20" font-weight="600" fill="rgba(255,255,255,0.4)" letter-spacing="2" text-transform="uppercase">Daily Insights</text>
        
        <!-- Swipe Indicator -->
        <rect x="800" y="1270" width="160" height="40" rx="20" fill="${palette.accent}" opacity="0.1"/>
        <text x="880" y="1296" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif" font-size="20" font-weight="bold" fill="${palette.accent}" text-anchor="middle">SWIPE →</text>
    </svg>`;

    await sharp(Buffer.from(svg)).png().toFile('test_hook.png');

    // Test Content Slide
    const svgContent = `<svg width="1080" height="1350" xmlns="http://www.w3.org/2000/svg">
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

        <rect width="1080" height="1350" fill="url(#bgGrad)"/>
        <circle cx="900" cy="500" r="500" fill="${palette.accent}" opacity="0.12" filter="url(#glow)"/>
        <rect width="1080" height="1350" fill="url(#grid)" />
        
        <!-- Header -->
        <image href="${profileB64}" x="120" y="80" height="80" width="80" clip-path="url(#profileClip)" preserveAspectRatio="xMidYMid slice" />
        <text x="220" y="115" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif" font-size="28" font-weight="bold" fill="#ffffff">Aryan Rajput</text>
        <text x="220" y="145" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif" font-size="20" fill="rgba(255,255,255,0.6)">@aryanrajput</text>
        
        <rect x="840" y="95" width="120" height="50" rx="25" fill="rgba(255,255,255,0.05)" stroke="rgba(255,255,255,0.1)" stroke-width="1"/>
        <text x="900" y="128" font-family="monospace" font-size="20" font-weight="bold" fill="${palette.accent}" text-anchor="middle" letter-spacing="2">02 / 09</text>

        <!-- Glassmorphism Card -->
        <rect x="100" y="300" width="880" height="700" rx="32" fill="rgba(255,255,255,0.03)" stroke="rgba(255,255,255,0.1)" stroke-width="2"/>
        
        <!-- Card Content -->
        <text x="160" y="420" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif" font-size="44" font-weight="bold" fill="${palette.accent}">
            <tspan x="160" dy="0">The Pentagon Deal</tspan>
        </text>
        
        <text x="160" y="520" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif" font-size="34" font-weight="400" fill="rgba(255,255,255,0.9)" line-height="1.6">
            <tspan x="160" dy="0">OpenAI recently changed their</tspan>
            <tspan x="160" dy="50">terms of service to allow military</tspan>
            <tspan x="160" dy="50">applications.</tspan>
            <tspan x="160" dy="70">This caused a massive uproar in</tspan>
            <tspan x="160" dy="50">the tech community, leading to a</tspan>
            <tspan x="160" dy="50">295% surge in uninstalls.</tspan>
            <tspan x="160" dy="70">Privacy is now the #1 concern for</tspan>
            <tspan x="160" dy="50">enterprise AI adopters.</tspan>
        </text>

        <!-- Footer -->
        <line x1="120" y1="1250" x2="960" y2="1250" stroke="rgba(255,255,255,0.1)" stroke-width="2" />
        <text x="120" y="1300" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif" font-size="20" font-weight="600" fill="rgba(255,255,255,0.4)" letter-spacing="2" text-transform="uppercase">Daily Insights</text>
        <rect x="800" y="1270" width="160" height="40" rx="20" fill="${palette.accent}" opacity="0.1"/>
        <text x="880" y="1296" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif" font-size="20" font-weight="bold" fill="${palette.accent}" text-anchor="middle">SWIPE →</text>
    </svg>`;

    await sharp(Buffer.from(svgContent)).png().toFile('test_content.png');
    console.log("Images generated!");
}
buildTestSvg();
