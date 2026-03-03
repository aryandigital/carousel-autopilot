// ============================================
// Medium Trend Discovery via RSS
// ============================================
const RssParser = require('rss-parser');
const parser = new RssParser();

const TOPICS = [
    'artificial-intelligence',
    'marketing',
    'design',
    'technology',
    'content-strategy',
    'psychology',
    'future',
    'productivity',
    'ux-design',
    'startup',
];

async function fetchMediumTopic(topic) {
    const url = `https://medium.com/feed/tag/${topic}`;

    try {
        const feed = await parser.parseURL(url);
        return (feed.items || []).slice(0, 5).map((item) => ({
            source: 'medium',
            topic,
            title: item.title || '',
            link: item.link || '',
            creator: item.creator || item['dc:creator'] || 'Unknown',
            snippet: (item.contentSnippet || '').slice(0, 400),
            published: item.pubDate || '',
        }));
    } catch (err) {
        console.warn(`⚠️  Medium tag "${topic}" failed:`, err.message);
        return [];
    }
}

async function discoverMediumTrends() {
    console.log('🔍 Scanning Medium for trends...');

    const results = [];
    for (const topic of TOPICS) {
        const articles = await fetchMediumTopic(topic);
        results.push(...articles);
        await new Promise((r) => setTimeout(r, 500));
    }

    console.log(`   Found ${results.length} Medium articles`);
    return results;
}

module.exports = { discoverMediumTrends };
