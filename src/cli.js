// ============================================
// CLI Entry Point
// ============================================
require('dotenv').config();
const { runPipeline } = require('./pipeline');

const command = process.argv[2] || 'dry-run';

(async () => {
    switch (command) {
        case 'generate':
        case 'live':
            console.log('🔴 LIVE MODE — Will post to LinkedIn\n');
            await runPipeline({ dryRun: false });
            break;

        case 'dry-run':
        case 'test':
        default:
            console.log('🟡 DRY RUN — Will NOT post to LinkedIn\n');
            await runPipeline({ dryRun: true });
            break;
    }
})();
