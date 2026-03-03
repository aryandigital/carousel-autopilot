// ============================================
// Reddit Trend Discovery (Unauthenticated)
// ============================================
// Uses Reddit's public .json endpoints — no API key needed

const SUBREDDITS = [
  'artificial',
  'marketing',
  'design',
  'technology',
  'Futurology',
  'content_marketing',
  'psychology',
  'ChatGPT',
  'StableDiffusion',
  'graphic_design',
];

const USER_AGENT = 'CarouselBot/1.0';

async function fetchSubreddit(subreddit, sort = 'hot', limit = 10) {
  const url = `https://www.reddit.com/r/${subreddit}/${sort}.json?limit=${limit}&t=day`;

  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': USER_AGENT },
    });

    if (!res.ok) {
      console.warn(`⚠️  Reddit r/${subreddit} returned ${res.status}`);
      return [];
    }

    const data = await res.json();
    const posts = data?.data?.children || [];

    return posts
      .filter((p) => !p.data.stickied && !p.data.over_18)
      .map((p) => ({
        source: 'reddit',
        subreddit: p.data.subreddit,
        title: p.data.title,
        score: p.data.score,
        comments: p.data.num_comments,
        url: `https://reddit.com${p.data.permalink}`,
        selftext: (p.data.selftext || '').slice(0, 500),
        created: new Date(p.data.created_utc * 1000).toISOString(),
      }));
  } catch (err) {
    console.error(`❌ Failed to fetch r/${subreddit}:`, err.message);
    return [];
  }
}

async function discoverRedditTrends() {
  console.log('🔍 Scanning Reddit for trends...');

  const results = [];
  // Fetch sequentially with small delays to avoid rate limits
  for (const sub of SUBREDDITS) {
    const posts = await fetchSubreddit(sub, 'hot', 8);
    results.push(...posts);
    // Small delay between requests
    await new Promise((r) => setTimeout(r, 800));
  }

  // Sort by engagement score (upvotes + comments × 2)
  results.sort((a, b) => (b.score + b.comments * 2) - (a.score + a.comments * 2));

  console.log(`   Found ${results.length} Reddit posts`);
  return results.slice(0, 20); // Top 20
}

module.exports = { discoverRedditTrends };
