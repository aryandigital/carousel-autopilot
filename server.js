// ============================================
// Express Web Server + Dashboard
// ============================================
require('dotenv').config();

const express = require('express');
const path = require('path');
const fs = require('fs');
const cron = require('node-cron');
const { runPipeline } = require('./src/pipeline');

const app = express();
const PORT = process.env.PORT || 3000;

// ── Middleware ──
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));
app.use('/output', express.static(path.join(__dirname, 'output')));

// ── State ──
let pipelineStatus = { running: false, lastRun: null, lastResult: null, history: [] };

// ── API Routes ──

// Get pipeline status + history 
app.get('/api/status', (req, res) => {
    res.json(pipelineStatus);
});

// Trigger a dry run (no LinkedIn post)
app.post('/api/generate', async (req, res) => {
    if (pipelineStatus.running) {
        return res.status(409).json({ error: 'Pipeline is already running' });
    }

    pipelineStatus.running = true;
    res.json({ message: 'Pipeline started (dry run)', status: 'running' });

    try {
        const result = await runPipeline({ dryRun: true });
        pipelineStatus.lastRun = new Date().toISOString();
        pipelineStatus.lastResult = result;
        pipelineStatus.history.unshift({
            timestamp: result.timestamp,
            status: result.status,
            topic: result.steps?.copy?.topic || 'Unknown',
            hook: result.steps?.copy?.hook || '',
            slideCount: result.steps?.copy?.slideCount || 0,
            outputDir: result.outputDir,
        });
        // Keep last 20 runs
        if (pipelineStatus.history.length > 20) pipelineStatus.history.pop();
    } catch (err) {
        pipelineStatus.lastResult = { status: 'failed', error: err.message };
    } finally {
        pipelineStatus.running = false;
    }
});

// Trigger live (publish to LinkedIn)
app.post('/api/publish', async (req, res) => {
    if (pipelineStatus.running) {
        return res.status(409).json({ error: 'Pipeline is already running' });
    }

    pipelineStatus.running = true;
    res.json({ message: 'Pipeline started (LIVE — will post to LinkedIn)', status: 'running' });

    try {
        const result = await runPipeline({ dryRun: false });
        pipelineStatus.lastRun = new Date().toISOString();
        pipelineStatus.lastResult = result;
        pipelineStatus.history.unshift({
            timestamp: result.timestamp,
            status: result.status,
            topic: result.steps?.copy?.topic || 'Unknown',
            hook: result.steps?.copy?.hook || '',
            slideCount: result.steps?.copy?.slideCount || 0,
            published: result.steps?.publish?.success || false,
            outputDir: result.outputDir,
        });
        if (pipelineStatus.history.length > 20) pipelineStatus.history.pop();
    } catch (err) {
        pipelineStatus.lastResult = { status: 'failed', error: err.message };
    } finally {
        pipelineStatus.running = false;
    }
});

// Discover trends only (preview)
app.get('/api/trends', async (req, res) => {
    try {
        const { discoverTrends } = require('./src/trends');
        const trends = await discoverTrends();
        res.json({ trends });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Get output files list
app.get('/api/outputs', (req, res) => {
    const outputDir = path.join(__dirname, 'output');
    if (!fs.existsSync(outputDir)) return res.json({ outputs: [] });

    const dirs = fs.readdirSync(outputDir)
        .filter((d) => fs.statSync(path.join(outputDir, d)).isDirectory())
        .sort()
        .reverse();

    const outputs = dirs.map((d) => {
        const dir = path.join(outputDir, d);
        const resultFile = path.join(dir, 'pipeline_results.json');
        const copyFile = path.join(dir, 'carousel_copy.json');
        const pdfFile = path.join(dir, 'carousel.pdf');

        let result = null, copy = null;
        try { result = JSON.parse(fs.readFileSync(resultFile, 'utf-8')); } catch { }
        try { copy = JSON.parse(fs.readFileSync(copyFile, 'utf-8')); } catch { }

        const slidesDir = path.join(dir, 'slides');
        let slides = [];
        if (fs.existsSync(slidesDir)) {
            slides = fs.readdirSync(slidesDir)
                .filter(f => f.endsWith('.png'))
                .sort()
                .map(f => `/output/${d}/slides/${f}`);
        }

        return {
            id: d,
            hasPdf: fs.existsSync(pdfFile),
            pdfUrl: `/output/${d}/carousel.pdf`,
            slides,
            result,
            copy,
        };
    });

    res.json({ outputs });
});

// Cron endpoint (for external cron services like cron-job.org)
app.get('/api/cron', (req, res) => {
    const secret = req.query.secret;
    if (process.env.CRON_SECRET && secret !== process.env.CRON_SECRET) {
        return res.status(403).json({ error: 'Invalid secret' });
    }

    if (pipelineStatus.running) {
        return res.status(409).json({ message: 'Pipeline already running' });
    }

    pipelineStatus.running = true;
    // Send a tiny response immediately — cron-job.org reads this and nothing else
    res.status(202).json({ ok: true });

    // ── Fully suppress ALL stdout/stderr during pipeline run ──
    // This prevents Render from buffering massive output that triggers "output too large"
    const origStdoutWrite = process.stdout.write.bind(process.stdout);
    const origStderrWrite = process.stderr.write.bind(process.stderr);
    const origLog = console.log;
    const origWarn = console.warn;
    const origError = console.error;

    const MAX_LOG_LINES = 50;
    const logBuffer = [];
    const capture = (line) => { if (logBuffer.length < MAX_LOG_LINES) logBuffer.push(line); };

    // Silence everything
    process.stdout.write = (chunk) => { capture(String(chunk).slice(0, 200)); return true; };
    process.stderr.write = (chunk) => { capture('[ERR] ' + String(chunk).slice(0, 200)); return true; };
    console.log = (...a) => capture(a.join(' ').slice(0, 200));
    console.warn = (...a) => capture('[W] ' + a.join(' ').slice(0, 200));
    console.error = (...a) => capture('[E] ' + a.join(' ').slice(0, 200));

    const restore = () => {
        process.stdout.write = origStdoutWrite;
        process.stderr.write = origStderrWrite;
        console.log = origLog;
        console.warn = origWarn;
        console.error = origError;
    };

    // Fire and forget: run in background
    runPipeline({ dryRun: false }).then(result => {
        pipelineStatus.lastRun = new Date().toISOString();
        pipelineStatus.lastResult = result;
        pipelineStatus.history.unshift({
            timestamp: result.timestamp,
            status: result.status,
            topic: result.steps?.copy?.topic || 'Unknown',
            hook: result.steps?.copy?.hook || '',
            slideCount: result.steps?.copy?.slideCount || 0,
            published: result.steps?.publish?.success || false,
        });
        pipelineStatus.running = false;
    }).catch(err => {
        pipelineStatus.lastResult = { status: 'failed', error: err.message };
        pipelineStatus.running = false;
    }).finally(() => {
        restore();
        console.log(`[CRON] Done. ${logBuffer.length} lines captured (max ${MAX_LOG_LINES}).`);
    });
});

// ── Local Cron (optional — for when running locally) ──
const cronHour = process.env.CRON_HOUR || 9;
const cronMinute = process.env.CRON_MINUTE || 0;
const cronExpression = `${cronMinute} ${cronHour} * * *`;

cron.schedule(cronExpression, async () => {
    console.log(`\n⏰ Scheduled run triggered at ${new Date().toLocaleString()}\n`);
    if (!pipelineStatus.running) {
        pipelineStatus.running = true;
        try {
            const result = await runPipeline({ dryRun: false });
            pipelineStatus.lastRun = new Date().toISOString();
            pipelineStatus.lastResult = result;
        } catch (err) {
            console.error('Scheduled run failed:', err);
        } finally {
            pipelineStatus.running = false;
        }
    }
}, { timezone: 'Asia/Kolkata' });

// ── SPA Fallback ──
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// ── Start ──
app.listen(PORT, () => {
    console.log(`\n🌐 Dashboard running at http://localhost:${PORT}`);
    console.log(`⏰ Daily schedule: ${cronHour}:${String(cronMinute).padStart(2, '0')} IST\n`);
});
