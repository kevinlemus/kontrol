# Kontrol

Personal social media command center for solo creators and developers.

## What it does

- Generate platform-specific posts in your voice using Claude AI
- Post to Instagram, TikTok, LinkedIn, Reddit, X, Facebook, YouTube, Steam, itch.io, and Game Jolt
- Monitor subreddits and get AI-suggested comments
- Smart scheduling based on optimal posting times per platform
- Voice learning — edits you make train the AI to sound more like you over time

## Tech Stack

- **Frontend:** React 18 PWA (Vite, TypeScript, Geist fonts)
- **Backend:** Spring Boot 3.2 (Java 21, Maven)
- **Database:** PostgreSQL via Supabase
- **AI:** Claude API (Anthropic — claude-sonnet-4-20250514)

## Setup

See [SETUP.md](SETUP.md) for full installation instructions.

Minimum to run:
1. Clone repo
2. Add `CLAUDE_API_KEY` + Supabase credentials to `backend/.env`
3. `npm run dev` in `frontend/` and `mvn spring-boot:run` in `backend/`

## Status

Active development — personal use tool.

## License

MIT
