# Kontrol

Kevin's personal social media command center. One app, all platforms, one voice.

**Live:** [kontrol.pages.dev](https://kontrol.pages.dev) · Backend: Render

---

## What it does

- **AI post generation** — type a thought, Claude generates platform-native posts for every channel simultaneously (Instagram caption, Reddit post, LinkedIn article, TikTok hook, etc.)
- **Voice learning** — edits you make to generated posts train future generations to sound more like you
- **Smart scheduling** — schedule entire batches across platforms, AI picks optimal posting times per platform
- **Reddit monitor** — watches subreddits for relevant posts, suggests contextual comments
- **Project switching** — manage multiple brands/projects (DaStu, Sumo Slam) from one interface
- **Connected accounts** — OAuth connect Instagram, Facebook, LinkedIn; generate and copy for others
- **Video hooks** — each generated post includes a punchy 5-8 word hook for on-screen video overlay
- **Per-platform competitive intelligence** — Claude's prompts include platform-specific framing based on your industry and competitors

## Platforms

| Platform | Status |
|---|---|
| Instagram | ✅ OAuth connected |
| Facebook | ✅ OAuth connected |
| LinkedIn | ✅ OAuth connected (requires "Share on LinkedIn" product in dev portal) |
| Reddit | ⏳ Pending app approval |
| TikTok | ⏳ Pending developer review |
| X (Twitter) | ⚠️ Requires paid API tier |
| YouTube | ⚠️ Credentials not yet added |
| Steam | ⏳ Pending Steamworks partner approval |
| itch.io | ⏳ API key needed |
| Game Jolt | ⏳ API key needed |

## Tech Stack

| Layer | Tech |
|---|---|
| Frontend | React 18 PWA, Vite, TypeScript, Geist fonts, Cloudflare Pages |
| Backend | Spring Boot 3.2, Java 21, Maven, Render |
| Database | PostgreSQL via Supabase |
| Storage | Supabase Storage (avatars, media) |
| AI | Claude API — claude-sonnet-4-20250514 |

## Environment Variables

### Backend (Render)

**Required — app will not start without these:**

```
SUPABASE_DB_URL        postgresql://...
SUPABASE_DB_USER       postgres
SUPABASE_DB_PASSWORD   ...
CLAUDE_API_KEY         sk-ant-...
JWT_SECRET             (32+ random chars)
FRONTEND_URL           https://kontrol.pages.dev
```

**Storage (required for avatar upload):**

```
SUPABASE_URL           https://xxx.supabase.co
SUPABASE_ANON_KEY      eyJ...
```

**Meta OAuth (Instagram + Facebook):**

```
META_APP_ID            ...
META_APP_SECRET        ...
INSTAGRAM_REDIRECT_URI https://your-render-url.onrender.com/api/v1/oauth/instagram/callback
FACEBOOK_REDIRECT_URI  https://your-render-url.onrender.com/api/v1/oauth/facebook/callback
```

**LinkedIn OAuth:**

```
LINKEDIN_CLIENT_ID     ...
LINKEDIN_CLIENT_SECRET ...
LINKEDIN_REDIRECT_URI  https://your-render-url.onrender.com/api/v1/oauth/linkedin/callback
```

**Pending platforms (add when credentials are ready):**

```
REDDIT_CLIENT_ID / REDDIT_CLIENT_SECRET / REDDIT_USERNAME / REDDIT_PASSWORD / REDDIT_REDIRECT_URI
TIKTOK_CLIENT_KEY / TIKTOK_CLIENT_SECRET / TIKTOK_REDIRECT_URI
TWITTER_API_KEY / TWITTER_API_SECRET / TWITTER_CLIENT_ID / TWITTER_CLIENT_SECRET / TWITTER_ACCESS_TOKEN / TWITTER_ACCESS_SECRET / TWITTER_REDIRECT_URI
YOUTUBE_API_KEY / YOUTUBE_CLIENT_ID / YOUTUBE_CLIENT_SECRET / YOUTUBE_REFRESH_TOKEN / YOUTUBE_REDIRECT_URI
STEAM_PARTNER_KEY / STEAM_APP_ID
ITCHIO_API_KEY / ITCHIO_GAME_ID
GAMEJOLT_API_KEY / GAMEJOLT_GAME_ID
```

### Frontend (Cloudflare Pages)

```
VITE_API_URL    https://your-render-url.onrender.com
```

## Local Development

```bash
# Backend
cd backend
cp .env.example .env    # fill in your credentials
JAVA_HOME=/path/to/jdk21 mvn spring-boot:run -Dspring-boot.run.profiles=local

# Frontend
cd frontend
cp .env.example .env    # set VITE_API_URL=http://localhost:8080
npm install
npm run dev
```

## Projects

**DaStu** — AI vocal studio for bedroom musicians  
Platform focus: Instagram, TikTok, LinkedIn, Reddit, YouTube

**Sumo Slam** — Arcade party brawler going to Steam/Switch/itch.io  
Platform focus: Instagram, TikTok, Reddit, X, YouTube, Steam, itch.io, Game Jolt

## Pending Items

- Reddit app approval (for posting + subreddit monitor)
- TikTok developer review (for posting + OAuth)
- LinkedIn "Share on LinkedIn" product must be added in developer portal
- X/Twitter requires Basic API tier ($100/month)
- YouTube OAuth credentials
- Steam Steamworks partner approval (for Sumo Slam)
- itch.io and Game Jolt API keys
- PWA push notifications (VAPID keys)

## Architecture Notes

- **JWT auth** on all write endpoints — token stored in `localStorage` as `kontrol_auth`
- **Voice learning** via `post_platforms` table — stores original vs edited content, performance tracked
- **Subreddit monitor** — background job checks monitored subreddits every 2h, 48h cooldown per subreddit
- **Smart scheduling** — stored in `scheduled_posts` table, executed by Spring `@Scheduled` task
- **Competitive intelligence** — per-platform framing injected into Claude system prompt from project's industry + competitor fields

## License

MIT — personal use tool
