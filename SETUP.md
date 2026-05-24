# Kontrol — Setup Guide

Everything you need to go from zero to live. The minimum viable setup takes ~10 minutes.

## Prerequisites

- Java 21+ (`java -version`)
- Node.js 20+ (`node -v`)
- Maven 3.9+ (`mvn -v`)
- A [Supabase](https://supabase.com) account (free tier works)
- An [Anthropic API key](https://console.anthropic.com/account/keys) for Claude

---

## 1. Clone the repo

```bash
git clone https://github.com/YOUR_USERNAME/kontrol.git
cd kontrol
```

## 2. Set up Supabase

1. Go to [supabase.com](https://supabase.com) -> New Project
2. Note your **Project URL**, **anon key**, and **database password**
3. Open the SQL Editor and paste the full schema from `CLAUDE.md` (the `CREATE TABLE` block)
4. Run it — all 8 tables will be created

## 3. Configure the backend

```bash
cd backend
cp .env.example .env
```

Edit `backend/.env` and fill in at minimum:
```
CLAUDE_API_KEY=sk-ant-...          # from console.anthropic.com
SUPABASE_DB_URL=jdbc:postgresql://db.YOUR_REF.supabase.co:5432/postgres
SUPABASE_DB_USER=postgres
SUPABASE_DB_PASSWORD=your_password
```

## 4. Configure the frontend

```bash
cd ../frontend
cp .env.example .env
```

Edit `frontend/.env`:
```
VITE_API_URL=http://localhost:8080
```

## 5. Run the backend

```bash
cd backend
mvn spring-boot:run
```

The backend starts at `http://localhost:8080`. You should see:
```
Started KontrolApplication in X.X seconds
```

## 6. Run the frontend

In a new terminal:
```bash
cd frontend
npm install
npm run dev
```

Open `http://localhost:5173`

## 7. First run

1. Go to **Projects** -> you will see DaStu and Sumo Slam (seeded locally)
2. Go to **Compose** -> type a post idea -> click Generate
   - If CLAUDE_API_KEY is set: real AI-generated drafts appear
   - If not: placeholder text appears with instructions
3. Approve drafts -> Smart Schedule -> posts appear in Schedule

## 8. Adding platform credentials

For each platform you want to publish to:

| Platform | Where to get credentials | .env keys needed |
|----------|--------------------------|------------------|
| Instagram | [Meta Developer Portal](https://developers.facebook.com/apps/) | `META_APP_ID`, `META_APP_SECRET` |
| TikTok | [TikTok Developers](https://developers.tiktok.com) (approval ~2 weeks) | `TIKTOK_CLIENT_KEY`, `TIKTOK_CLIENT_SECRET` |
| LinkedIn | [LinkedIn Developer Portal](https://www.linkedin.com/developers/apps) | `LINKEDIN_CLIENT_ID`, `LINKEDIN_CLIENT_SECRET` |
| Reddit | [Reddit App Prefs](https://www.reddit.com/prefs/apps) (type: script) | `REDDIT_CLIENT_ID`, `REDDIT_CLIENT_SECRET`, `REDDIT_USERNAME`, `REDDIT_PASSWORD` |
| X/Twitter | [Twitter Developer Portal](https://developer.twitter.com) (Elevated access) | `TWITTER_API_KEY`, `TWITTER_API_SECRET`, `TWITTER_ACCESS_TOKEN`, `TWITTER_ACCESS_SECRET` |
| Facebook | Same Meta app as Instagram — add `pages_manage_posts` permission | `FACEBOOK_PAGE_ACCESS_TOKEN`, `FACEBOOK_PAGE_ID` |
| YouTube | [Google Cloud Console](https://console.cloud.google.com) -> YouTube Data API v3 | `YOUTUBE_CLIENT_ID`, `YOUTUBE_CLIENT_SECRET`, `YOUTUBE_REFRESH_TOKEN` |
| Steam | [Steamworks Partner Portal](https://partner.steamgames.com) | `STEAM_PARTNER_KEY`, `STEAM_APP_ID` |
| itch.io | [itch.io Settings -> API Keys](https://itch.io/user/settings/api-keys) | `ITCHIO_API_KEY`, `ITCHIO_GAME_ID` |
| Game Jolt | [Game Jolt Dashboard -> API Settings](https://gamejolt.com/dashboard) | `GAMEJOLT_GAME_ID`, `GAMEJOLT_API_KEY` |

After adding credentials: restart the backend (`mvn spring-boot:run`)

## 9. Production deployment

**Frontend -> Cloudflare Pages:**
1. Connect your GitHub repo to Cloudflare Pages
2. Build command: `npm run build` (in `frontend/`)
3. Set `VITE_API_URL=https://your-render-backend.onrender.com`

**Backend -> Render:**
1. Create a Web Service pointing to the repo
2. Root directory: `backend`
3. Build command: `mvn package -DskipTests`
4. Start command: `java -jar target/kontrol-backend-0.1.0.jar`
5. Add all environment variables from `backend/.env`

---

## What works without any credentials

| Feature | Without credentials |
|---------|---------------------|
| Compose screen | Full UI (generates placeholder drafts) |
| Projects, Schedule, Reddit, Settings | Full UI with mock data |
| AI generation | Needs `CLAUDE_API_KEY` |
| Publishing to platforms | Each needs its own credentials |
| Reddit monitor job | Needs Reddit credentials |
| Database persistence | Needs Supabase credentials |
