-- Create project "User Acquisition for Warm Respondents" for dmitry.ivanov.developer@gmail.com in workspace Validatey
-- Run via: Supabase SQL Editor or psql

INSERT INTO public.projects (
  id,
  user_id,
  workspace_id,
  name,
  status,
  segment,
  hypothesis,
  market_context,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  '4cc56fc4-3814-4c0b-9ac9-6168fc2795c4',
  '023fc4d2-e85a-4c22-ae5b-ad10c473e8c3',
  'User Acquisition for Warm Respondents',
  'draft',
  '{
    "description": "Product managers, UX researchers, and startup founders who regularly conduct user research but struggle to recruit qualified participants. They work in B2B SaaS companies with limited research budgets (under $500/month) and have previously attempted respondent recruitment through owned channels (email lists, social media, in-app) with poor response rates.",
    "demographics": {
      "role": "Product Manager (45%), UX Researcher (30%), Founder (25%)",
      "companySize": "10-500 employees",
      "industry": "B2B SaaS (70%), B2C Digital Products (30%)",
      "geography": "North America (50%), Europe (30%), Asia-Pacific (20%)",
      "experience": "3-10 years in product/research roles",
      "budgetAuthority": "Can spend up to $500/month without approval",
      "researchFrequency": "2-4 research rounds per quarter"
    }
  }'::jsonb,
  '{
    "description": "We believe that product teams struggle to find warm, qualified respondents without paying for panels or recruitment agencies because existing free channels (email, social, personal networks) yield low response rates and poor targeting, leading to delayed research cycles, biased samples, and skipped validation steps that result in building features nobody wants.",
    "assumptions": [
      "Recruitment is a real pain point: teams actually struggle to find respondents; they have tried multiple free methods and failed; the problem is not just we do not want to pay.",
      "Quality matters, not just quantity: warm respondents (qualified, engaged) are meaningfully different from cold panels; bad respondents produce misleading insights; teams can tell the difference in data quality.",
      "Free alternatives are insufficient: email lists are too small or unresponsive; social media reach is declining organically; personal networks exhaust quickly; community scraping is too manual.",
      "Teams would use a non-monetary exchange: they would trade access to their users for access to others; they would participate in others research to earn credits; the barter economy is psychologically acceptable.",
      "The problem is widespread enough: not just early-stage startups; not just companies without existing user bases; cross-industry, cross-geography."
    ]
  }'::jsonb,
  '{
    "marketPicture": "Current State: The user research recruitment market is fragmented. Free/DIY: LinkedIn outreach (labor intensive, low yield), personal networks (finite, biased), social media posts, community posts (Slack, Reddit, FB groups), existing user emails (limited size, selection bias), Respondent.io free tier. Paid: UserTesting ($49-199/participant), Respondent.io ($40-140), User Interviews ($40-200), Prolific ($6-15), research panels ($20-100), recruitment agencies ($500-2000+ per study). Market Size: Global UX research software ~$1.2B (2023); recruitment services ~30% or $360M; growing 15-20% annually; ~500k product managers, ~200k UX researchers. Key Trends: Remote research standard (post-COVID), AI tools reducing analysis time, rising cost of paid panels, companies cutting research budgets, self-serve research tools democratizing access. Gaps: No dominant free/community solution, existing networks do not incentivize participation, quality varies wildly, no respondent loyalty programs, cross-company respondent sharing does not exist.",
    "marketFit": "Why Now: (1) Economic pressure – companies cutting budgets; research first to go or last to get funding; teams need cheaper alternatives. (2) Remote work normalization – geographic constraints gone but finding distributed participants harder; global respondent pools needed. (3) Research democratization – non-researchers (PMs, designers) conducting more studies; lack professional networks and recruitment expertise. (4) AI overhype – teams skeptical of AI-generated insights; want real human feedback to ground truth AI. (5) Build trap awareness – 42% of startups fail from no market need (CB Insights). Willingness to Pay (Indirectly): Teams will pay for time savings ($49/month for automation), trade value (respondent credits), pay for premium features (analytics, targeting), pay for guarantees (screened, qualified). Free + barter is psychologically different from paid.",
    "differentiation": "How a Respondent Network Would Be Different: Pay per respondent vs Earn respondents through participation; One-way transactions vs Reciprocal community; You are just a buyer vs You are both contributor and beneficiary; No loyalty/rewards vs Reputation system, gamification, credits; Quality unknown vs Verified profiles, ratings, history; Cold outreach vs Warm introductions through network; You start from zero each time vs Build respondent relationships over time. Unique Value: (1) Frequent Flyer Program for Research – more you participate, more respondents you get. (2) Quality Through Reciprocity – community self-policies quality. (3) Warm vs Cold – pre-qualified, motivated respondents. (4) Evergreen Respondent Relationships – re-contact participants, build panels over time. (5) Cross-Company Insights – benchmark data. Competitive Moats: Network effects, reputation data, community lock-in, data moat."
  }'::jsonb,
  now(),
  now()
)
RETURNING id, name, workspace_id, user_id;
