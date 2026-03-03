// ============================================
// Trend Aggregator
// ============================================
// Merges Reddit + Medium trends, deduplicates, ranks

const { discoverRedditTrends } = require('./reddit');
const { discoverMediumTrends } = require('./medium');

/**
 * Discover and aggregate the hottest trends across platforms
 * @returns {Promise<Array>} Ranked list of trend objects
 */
async function discoverTrends() {
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🌐 TREND DISCOVERY');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━\n');

    const [redditPosts, mediumArticles] = await Promise.all([
        discoverRedditTrends(),
        discoverMediumTrends(),
    ]);

    // Unify into a single format
    const allTrends = [
        ...redditPosts.map((p) => ({
            source: 'reddit',
            title: p.title,
            context: p.selftext || '',
            engagement: p.score + p.comments * 2,
            url: p.url,
            meta: `r/${p.subreddit} · ${p.score}↑ · ${p.comments} comments`,
        })),
        ...mediumArticles.map((a) => ({
            source: 'medium',
            title: a.title,
            context: a.snippet || '',
            engagement: 50, // Medium doesn't expose claps via RSS
            url: a.link,
            meta: `Medium · ${a.topic} · by ${a.creator}`,
        })),
    ];

    // Deduplicate by similarity (simple keyword overlap)
    const unique = deduplicateTrends(allTrends);

    // Sort by engagement
    unique.sort((a, b) => b.engagement - a.engagement);

    const top = unique.slice(0, 10);
    console.log(`\n✅ Top ${top.length} trends selected:\n`);
    top.forEach((t, i) => console.log(`   ${i + 1}. [${t.source}] ${t.title}`));

    return top;
}

function deduplicateTrends(trends) {
    const seen = new Set();
    return trends.filter((t) => {
        const keywords = t.title
            .toLowerCase()
            .replace(/[^a-z0-9\s]/g, '')
            .split(/\s+/)
            .filter((w) => w.length > 3)
            .sort()
            .join(' ');

        if (seen.has(keywords)) return false;
        seen.add(keywords);
        return true;
    });
}

module.exports = { discoverTrends };
