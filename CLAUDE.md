# CLAUDE.md — Kontrol

## What This Is
Kontrol is Kevin's personal social media command center. Solo use only.
One app, multiple projects (DaStu, Sumo Slam, future), one voice, all platforms.

## Stack
- Frontend: React 18 PWA, Vite, Geist fonts, Cloudflare Pages
- Backend: Java 21, Spring Boot 3.2, Maven, Render
- Database: PostgreSQL via Supabase
- Storage: Supabase Storage
- AI: Claude API (claude-sonnet-4-20250514)

## Design System
Background: #000, Cards: #181818, Accent: #3B82F6, Approve: #1ED760
Fonts: Geist Sans (display/body) + Geist Mono (data/tags)
Reference: ./design/handoff/ — always check this before building any UI

## Platforms
Instagram, TikTok, LinkedIn, Reddit, X, Facebook, YouTube, Steam, itch.io, Game Jolt
Each has its own service class in backend. Toggle per project.
Steam/itch.io/Game Jolt default ON for Sumo Slam, OFF for DaStu.

## Agent Lanes
- frontend-agent: ./frontend/ only
- backend-agent: ./backend/ only
- db-agent: read-only, schema in this file
- reviewer-agent: read-only everywhere, runs before every commit
- git-agent: commits and branches only, never touches main

## Current Sprint
Sprint 1 — Scaffold only.
Goal: folder structure, subagents, CLAUDE.md, React PWA scaffold (dark theme, Geist fonts, PWA manifest, bottom nav shell, placeholder screens), Spring Boot scaffold (project structure, Supabase connection, /api/v1/ base), database schema applied.
Do NOT build features yet. Scaffold and confirm.

## Kevin's Projects (seed data)
DaStu: AI vocal studio for bedroom musicians | Bedroom rappers/R&B singers on phones | Raw, real, built by someone who makes music | Status: Sprint 1 — building Python audio microservice
Sumo Slam: Arcade party brawler game going to Steam/Switch/itch.io | Party gamers, indie game fans | Fun, chaotic, Nintendo-polish quality bar | Status: Art production phase, 12 character roster finalized

## Database Schema

```sql
CREATE TABLE projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  what_it_is TEXT,
  who_its_for TEXT,
  vibe TEXT,
  current_status TEXT,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE platform_configs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  platform TEXT NOT NULL,
  enabled BOOLEAN DEFAULT true,
  use_global_account BOOLEAN DEFAULT true,
  access_token TEXT,
  refresh_token TEXT,
  account_id TEXT,
  extra_config JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE global_platform_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  platform TEXT UNIQUE NOT NULL,
  access_token TEXT,
  refresh_token TEXT,
  account_id TEXT,
  extra_config JSONB,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  input_type TEXT NOT NULL,
  input_content TEXT,
  media_url TEXT,
  status TEXT DEFAULT 'draft',
  scheduled_at TIMESTAMPTZ,
  published_at TIMESTAMPTZ,
  source TEXT DEFAULT 'manual',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE post_platforms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID REFERENCES posts(id) ON DELETE CASCADE,
  platform TEXT NOT NULL,
  post_type TEXT,
  content TEXT,
  extra_data JSONB,
  status TEXT DEFAULT 'pending',
  published_at TIMESTAMPTZ,
  platform_post_id TEXT,
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE subreddit_monitors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  subreddit TEXT NOT NULL,
  active BOOLEAN DEFAULT true,
  last_checked_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE reddit_suggestions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  subreddit TEXT NOT NULL,
  reddit_post_id TEXT NOT NULL,
  reddit_post_title TEXT,
  reddit_post_url TEXT,
  suggested_comment TEXT,
  status TEXT DEFAULT 'pending',
  posted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE scheduled_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID REFERENCES posts(id) ON DELETE CASCADE,
  scheduled_at TIMESTAMPTZ NOT NULL,
  executed_at TIMESTAMPTZ,
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```
