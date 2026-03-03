# Carousel Autopilot 🚀

**Daily LinkedIn Carousel Automation** — Discover trends, generate AI copy & images, and auto-post carousels to LinkedIn.

## Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Copy .env and add your API keys
cp .env.example .env

# 3. Start the dashboard
npm start

# 4. Open http://localhost:3000
```

## API Keys (All Free)

| Service | Get Key | Purpose |
|---------|---------|---------|
| Google AI Studio | [aistudio.google.com](https://aistudio.google.com/apikey) | Text copy + Image generation |
| LinkedIn | [developer.linkedin.com](https://developer.linkedin.com/) | Auto-posting carousels |

## Usage

### Web Dashboard
```bash
npm start          # Start server at localhost:3000
```

### CLI
```bash
npm run dry-run    # Generate carousel without posting
npm run generate   # Generate + post to LinkedIn
```

### Scheduled Daily (cron-job.org)
Set up a free cron at [cron-job.org](https://cron-job.org) to hit:
```
GET https://your-app.onrender.com/api/cron?secret=YOUR_SECRET
```

## Deploy to Render (Free)

1. Push to GitHub
2. Go to [render.com](https://render.com) → New Web Service
3. Connect your GitHub repo
4. Settings:
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
5. Add environment variables from `.env.example`
6. Deploy!

## Architecture

```
Trends (Reddit/Medium) → Gemini Copy → Nano Banana Images → PDF → LinkedIn
```

## License
MIT
