// Full deployment script: Create GitHub repo + Render service + set env vars
const RENDER_API_KEY = 'rnd_0iq2Pjk5QlujIRetUEkSgOLKpGIe';
const RENDER_BASE = 'https://api.render.com/v1';
const OWNER_ID = 'tea-cuiim33qf0us73dpun30';

const renderHeaders = {
    'Authorization': `Bearer ${RENDER_API_KEY}`,
    'Accept': 'application/json',
    'Content-Type': 'application/json',
};

// Environment variables to set on Render
const ENV_VARS = [
    { key: 'GOOGLE_AI_API_KEY', value: 'AIzaSyBEeg5lkMAD4d9lXUJQIOiLn3VoTl7RY2w' },
    { key: 'LINKEDIN_ACCESS_TOKEN', value: 'WPL_AP1.IsKGphMdIUV2wygp.Z2YUFg' },
    { key: 'LINKEDIN_CLIENT_ID', value: '86lpox4xid03e7' },
    { key: 'CRON_HOUR', value: '9' },
    { key: 'CRON_MINUTE', value: '0' },
    { key: 'CRON_SECRET', value: 'carousel-auto-2024' },
    { key: 'NODE_ENV', value: 'production' },
];

async function createRenderService() {
    console.log('\n📦 Creating Render Web Service...\n');

    const body = {
        autoDeployTrigger: 'commit',
        branch: 'master',
        name: 'carousel-autopilot',
        ownerId: OWNER_ID,
        repo: 'https://github.com/aryandigital/carousel-autopilot',
        rootDir: '',
        type: 'web_service',
        serviceDetails: {
            env: 'node',
            envSpecificDetails: {
                buildCommand: 'npm install',
                startCommand: 'npm start',
            },
            plan: 'free',
            region: 'ohio',
            runtime: 'node',
            numInstances: 1,
            pullRequestPreviewsEnabled: 'no',
        },
        envVars: ENV_VARS,
    };

    const res = await fetch(`${RENDER_BASE}/services`, {
        method: 'POST',
        headers: renderHeaders,
        body: JSON.stringify(body),
    });

    const data = await res.json();

    if (!res.ok) {
        console.error('❌ Failed to create service:', res.status, JSON.stringify(data, null, 2));
        return null;
    }

    console.log('✅ Service created!');
    console.log('Service ID:', data.service?.id);
    console.log('URL:', data.service?.serviceDetails?.url);
    console.log('Dashboard:', data.service?.dashboardUrl);
    return data;
}

async function main() {
    console.log('='.repeat(50));
    console.log('  CAROUSEL AUTOPILOT — RENDER DEPLOYMENT');
    console.log('='.repeat(50));

    // Create Render service (will fail if no GitHub repo yet, but we try)
    const service = await createRenderService();

    if (service) {
        console.log('\n✅ DEPLOYMENT INITIATED!');
        console.log('━'.repeat(50));
        console.log(`🌐 Your app URL: ${service.service?.serviceDetails?.url}`);
        console.log(`📊 Dashboard: ${service.service?.dashboardUrl}`);
        console.log('━'.repeat(50));
        console.log('\n⚠️  IMPORTANT: Push your code to GitHub first:');
        console.log('   git remote add origin https://github.com/aryandigital/carousel-autopilot.git');
        console.log('   git push -u origin master');
    }
}

main();
