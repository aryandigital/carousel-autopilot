// ============================================
// Pipeline Orchestrator
// ============================================
// End-to-end automation: Trends → Copy → Images → PDF → LinkedIn

const path = require('path');
const fs = require('fs');
const { discoverTrends } = require('./trends');
const { generateCarouselCopy } = require('./copywriter');
const { generateSlideImages } = require('./imageGenerator');
const { assemblePDF } = require('./pdfAssembler');
const { postToLinkedIn } = require('./linkedin');

/**
 * Run the full carousel generation pipeline
 * @param {Object} options
 * @param {boolean} options.dryRun - If true, skip LinkedIn posting
 * @param {number}  options.trendIndex - Which trend to use (default: 0 = top trend)
 * @returns {Promise<Object>} Pipeline results
 */
async function runPipeline(options = {}) {
    const { dryRun = false, trendIndex = 0 } = options;
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
    const outputDir = path.join(process.cwd(), 'output', timestamp);

    console.log('\n╔══════════════════════════════════════╗');
    console.log('║   🚀 CAROUSEL AUTOMATION PIPELINE    ║');
    console.log('╠══════════════════════════════════════╣');
    console.log(`║   Mode: ${dryRun ? 'DRY RUN' : 'LIVE'}                        ║`);
    console.log(`║   Time: ${new Date().toLocaleString()}    ║`);
    console.log('╚══════════════════════════════════════╝\n');

    const results = {
        timestamp,
        status: 'running',
        steps: {},
    };

    try {
        // ── Step 1: Discover Trends ──
        const trends = await discoverTrends();
        results.steps.trends = { count: trends.length, top: trends.slice(0, 5) };

        if (trends.length === 0) {
            throw new Error('No trends found — check internet connection');
        }

        // --- Deduplication Logic ---
        const usedTopics = new Set();
        try {
            const outputs = fs.readdirSync(path.join(process.cwd(), 'output'));
            for (const dir of outputs) {
                const resultsPath = path.join(process.cwd(), 'output', dir, 'pipeline_results.json');
                if (fs.existsSync(resultsPath)) {
                    const data = JSON.parse(fs.readFileSync(resultsPath, 'utf8'));
                    if (data.steps?.selectedTrend?.title) {
                        usedTopics.add(data.steps.selectedTrend.title.toLowerCase().trim());
                    }
                }
            }
        } catch (e) {
            // Directory might not exist yet, ignore
        }

        const freshTrends = trends.filter(t => !usedTopics.has(t.title.toLowerCase().trim()));
        const selectedTrend = freshTrends.length > 0 ? freshTrends[trendIndex] || freshTrends[0] : trends[0];

        console.log(`   Selected fresh trend: "${selectedTrend.title}"`);
        results.steps.selectedTrend = selectedTrend;

        // ── Step 2: Generate Carousel Copy ──
        const carouselCopy = await generateCarouselCopy(selectedTrend);
        results.steps.copy = {
            topic: carouselCopy.topic,
            slideCount: carouselCopy.slides?.length || 0,
            hook: carouselCopy.hook || carouselCopy.slides?.[0]?.headline,
        };

        // Save copy as JSON
        fs.mkdirSync(outputDir, { recursive: true });
        fs.writeFileSync(
            path.join(outputDir, 'carousel_copy.json'),
            JSON.stringify(carouselCopy, null, 2)
        );

        // ── Step 3: Generate Slide Images ──
        const slidesDir = path.join(outputDir, 'slides');
        const imagePaths = await generateSlideImages(carouselCopy, slidesDir);
        results.steps.images = { count: imagePaths.length, dir: slidesDir };

        // ── Step 4: Assemble PDF ──
        const pdfPath = path.join(outputDir, 'carousel.pdf');
        await assemblePDF(imagePaths, pdfPath);
        results.steps.pdf = { path: pdfPath, size: fs.statSync(pdfPath).size };

        // ── Step 5: Publish to LinkedIn ──
        if (!dryRun) {
            const publishResult = await postToLinkedIn(
                pdfPath,
                carouselCopy.caption || '',
                carouselCopy.hashtags || []
            );
            results.steps.publish = publishResult;
        } else {
            console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━');
            console.log('⏭️  SKIPPING PUBLISH (dry run)');
            console.log('━━━━━━━━━━━━━━━━━━━━━━━━\n');
            results.steps.publish = { skipped: true, reason: 'dry run' };
        }

        results.status = 'completed';
        results.outputDir = outputDir;

        console.log('\n╔══════════════════════════════════════╗');
        console.log('║   ✅ PIPELINE COMPLETED              ║');
        console.log(`║   Output: ${path.basename(outputDir).padEnd(26)}║`);
        console.log('╚══════════════════════════════════════╝\n');

    } catch (err) {
        results.status = 'failed';
        results.error = err.message;
        console.error('\n❌ Pipeline failed:', err.message);
        console.error(err.stack);
    }

    // Save results
    fs.mkdirSync(outputDir, { recursive: true });
    fs.writeFileSync(
        path.join(outputDir, 'pipeline_results.json'),
        JSON.stringify(results, null, 2)
    );

    return results;
}

module.exports = { runPipeline };
