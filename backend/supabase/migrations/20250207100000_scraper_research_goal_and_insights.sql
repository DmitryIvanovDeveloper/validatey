-- Add research_goal to scraper_sources (link to hypothesis)
ALTER TABLE scraper_sources
  ADD COLUMN IF NOT EXISTS research_goal TEXT
  CHECK (research_goal IS NULL OR research_goal IN (
    'price_strategy', 'user_pains', 'market_trends', 'competitor_features', 'find_respondents'
  ));

-- Add insights_summary to scraper_runs (AI-generated summary)
ALTER TABLE scraper_runs
  ADD COLUMN IF NOT EXISTS insights_summary TEXT;
