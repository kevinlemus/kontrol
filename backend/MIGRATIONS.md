# MIGRATIONS — Run these manually in Supabase SQL editor

## Feature 1 — AI Image Generation

```sql
CREATE TABLE IF NOT EXISTS generated_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  post_id UUID,
  image_url TEXT NOT NULL,
  image_prompt TEXT NOT NULL,
  seed BIGINT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

## Feature 2 — Analytics

```sql
CREATE TABLE IF NOT EXISTS analytics_insights (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  insight_text TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

## Feature 3 — Competitor Intelligence

```sql
CREATE TABLE IF NOT EXISTS competitor_insights (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  competitor_name TEXT NOT NULL,
  platform TEXT NOT NULL,
  post_frequency TEXT,
  top_content_types TEXT,
  engagement_patterns TEXT,
  claude_analysis TEXT,
  differentiation_tips TEXT,
  last_analyzed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

## Feature 4 — Content Strategy Cache

```sql
CREATE TABLE IF NOT EXISTS strategy_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  suggestions JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

## Feature 5 — Ad Campaigns

```sql
CREATE TABLE IF NOT EXISTS ad_campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  post_platform_id UUID,
  platform TEXT,
  daily_budget NUMERIC(10,2),
  duration_days INTEGER,
  targeting JSONB,
  status TEXT DEFAULT 'draft',
  platform_campaign_id TEXT,
  impressions BIGINT DEFAULT 0,
  clicks BIGINT DEFAULT 0,
  spend NUMERIC(10,2) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

## Feature 6 — Weekly Reports

```sql
CREATE TABLE IF NOT EXISTS weekly_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  week_of DATE NOT NULL,
  posts_published INTEGER DEFAULT 0,
  posts_planned INTEGER DEFAULT 0,
  total_engagement BIGINT DEFAULT 0,
  vs_last_week DOUBLE PRECISION DEFAULT 0,
  top_post_content TEXT,
  top_post_platform TEXT,
  top_post_score DOUBLE PRECISION DEFAULT 0,
  claude_summary TEXT,
  recommendations JSONB,
  platform_breakdown JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```
