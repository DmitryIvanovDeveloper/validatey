export interface LandingGenerationPromptData {
  hypothesis: string;
  problem: string;
  segment: string;
  /** Optional: short validation/synthesis summary for richer copy (e.g. "184 comments analyzed, 67% confirm problem") */
  validationData?: string;
  customPrompt?: string;
}

export class LandingGenerationPromptService {
  /**
   * Создает полный промпт для генерации landing страницы
   */
  static buildGenerationPrompt(data: LandingGenerationPromptData): string {
    return `${this.getSystemPrompt()}

${this.getContextPrompt(data)}

${this.getRequirementsPrompt()}

${this.getOutputFormatPrompt()}`;
  }

  /**
   * Системный промпт - позиционирует AI как профессионала
   */
  private static getSystemPrompt(): string {
    return `You are a senior landing page designer and conversion optimization expert with 15+ years of experience building high-converting landing pages for SaaS startups, B2B companies, and consumer products.

Your expertise includes:
- Modern web design principles and best practices
- Conversion rate optimization (CRO) techniques
- User experience (UX) design for landing pages
- Copywriting that drives action
- Technical implementation of responsive designs
- A/B testing and data-driven design decisions

You have successfully built landing pages that generated:
- 500%+ increase in conversion rates
- $10M+ in revenue for various startups
- Thousands of qualified leads for B2B companies
- Millions of users for consumer apps

Your design philosophy: "Design that feels like a premium experience. Every element should inspire confidence and desire. Think luxury hotel lobby meets Silicon Valley sleekness - spacious, elegant, and undeniably professional."

You create landing pages that look like they cost $50K+ to design. Your pages have:
- The polish of high-end SaaS products (Stripe, Notion, Linear)
- Emotional depth that builds trust and desire
- Visual storytelling that guides users naturally to conversion
- The kind of elegance that makes users think "this company knows what they're doing"

You avoid anything that looks cheap, generic, or hastily put together. Your designs feel expensive, thoughtful, and conversion-optimized.`;
  }

  /**
   * Контекст проекта - данные из Supabase
   */
  private static getContextPrompt(data: LandingGenerationPromptData): string {
    return `PROJECT CONTEXT:
- Hypothesis: ${data.hypothesis}
- Problem Solved: ${data.problem}
- Target Audience: ${data.segment}
${data.validationData ? `- Validation Data (if available): ${data.validationData}` : ''}
${data.customPrompt ? `- Additional Instructions: ${data.customPrompt}` : ''}`;
  }

  /**
   * Технические требования к landing странице
   */
  private static getRequirementsPrompt(): string {
    return `
LANDING PAGE REQUIREMENTS:

DESIGN STYLE (create something visually stunning and conversion-focused):
- Hero section: Dramatic gradient background with subtle pattern overlay - make it feel premium and trustworthy
- Visual depth: Elegant shadows on cards and sections, smooth rounded corners that feel modern and friendly
- Typography: Bold, readable hierarchy with generous spacing - headlines that command attention, body text that flows beautifully
- Layout variety: Mix full-width hero with contained content sections, alternate backgrounds for visual rhythm
- Color palette: Rich accent color (emerald, violet, coral) with sophisticated neutrals - avoid boring grays
- Breathing room: Generous whitespace that makes the page feel spacious and premium
- Polish touches: Subtle hover animations, smooth transitions, elegant focus states
- NEVER: Plain white backgrounds, cramped layouts, flat buttons, or anything that looks cheap

USER EXPERIENCE (make it feel premium and trustworthy):
- Hero presence: Tall enough to showcase value without overwhelming, short enough to hint at more content below
- Spacing harmony: Consistent rhythm that feels balanced and breathing - not cramped, not wasteful
- Reading experience: Perfect line lengths for comfortable reading, clear hierarchy that guides the eye
- Interactive elegance: Buttons that feel substantial and responsive, smooth animations that delight
- Layout intelligence: Clean containers that focus attention, alternating sections that create visual flow
- Accessibility polish: Focus states that are elegant, not clunky
- Process clarity: "How it works" steps that feel like premium onboarding, not boring checklists

CREATIVE VARIATION (each landing should feel unique and inspired):
- Hero personality: Experiment with gradient angles, color combinations, and subtle patterns - make each one feel fresh
- Value messaging: Rephrase the core benefit in compelling, memorable ways that resonate emotionally
- Layout exploration: Sometimes center-focused, sometimes split layout - whatever serves the story best
- Social proof styling: Mix quote styles, testimonial formats, and presentation approaches for visual interest

TECHNICAL FOUNDATION:
- Typography: Use Inter font family for modern, professional feel
- Images: Create testimonial avatars using inline SVG or styled initials (no external URLs)
- Responsive: Works beautifully on all devices from mobile to desktop
- Performance: Clean, efficient code that loads fast

CONTENT STRUCTURE (mandatory sections, in this order):

1. HERO SECTION:
   - Compelling headline (7 words max) that communicates the UNIQUE MECHANISM of the solution (e.g. "Give Feedback, Get Feedback" or "Swap Reviews with Fellow Founders").
   - Subheadline (1-2 sentences) that expands on the value proposition and hints at the reciprocity mechanic.
   - Primary Call-to-Action button with clear, action-oriented text (e.g. "Join the Waitlist", "Get Early Access" — be consistent with the actual next step). Do NOT use "Join Now" if the next step is only email signup; use "Join Waitlist" or "Get Early Access" instead.
   - Optional secondary CTA (e.g. "Learn More") but keep primary focus.
   - Trust indicators: e.g. number of users, testimonials, or logos.

2. PROBLEM SECTION:
   - Title: e.g. "Tired of Getting 'Cool, bro' Comments?"
   - 3-4 specific pain points with relatable scenarios. Use concrete examples and data if available from validation. Examples: "You spent weeks building a landing page, posted on Indie Hackers, and got 2 comments: 'nice' and 'good luck'."; "Friends say they love it, but they never actually use it."; "Forums are noisy: your post disappears in an hour, buried under memes."
   - Include an emotional hook: make the reader feel understood.

3. SOLUTION SECTION (How It Works):
   - Title: use a short product name derived from the hypothesis (e.g. first 2–4 words), e.g. "Introducing Feedback Loop" or "Introducing Swap Feedback". Never output the literal placeholder "[Product Name]".
   - Briefly explain the core mechanism in 2-3 sentences.
   - Show the step-by-step process visually (use numbered steps or cards with icons): (1) Share your project – form describing project, target audience, questions. (2) Give feedback to others – choose projects, leave structured feedback. (3) Receive guaranteed feedback – your project gets featured, you receive detailed reviews.
   - Emphasize reciprocity: "No more one-way streets. Everyone gives, everyone gets."
   - If available, include a proof point: e.g. "Average feedback length: 300+ words. 94% of users find it helpful."

4. WHY IT'S DIFFERENT (unique value proposition):
   - Bullet points or short cards highlighting key differentiators from existing alternatives (Reddit, Indie Hackers, Product Hunt). Examples: "Structured feedback templates – no more vague comments."; "Reciprocity guarantee – you get feedback only after giving."; "Community of experienced founders – not random strangers."; "Actionable insights, not just praise."

5. SOCIAL PROOF:
   - Testimonials (3-5 realistic quotes) with: realistic name, role, and project (e.g. "Alex Chen, Founder of LaunchMetrics"); specific results or benefits (e.g. "The feedback helped me double my conversion rate."). For avatars use ONLY data: URIs (e.g. SVG with initial letter) or CSS-only initials—never external URLs (see IMAGES AND ASSETS above).
   - If available, include metrics: "Joined by 200+ founders", "Average rating 4.8/5", "500+ pieces of feedback exchanged".

6. FINAL CALL-TO-ACTION:
   - Clear headline: e.g. "Stop Building in Silence. Start Getting Honest Feedback."
   - Reiterate the primary CTA button with the SAME text as in hero (consistency).
   - Add a subtle urgency/scarcity element if appropriate: e.g. "First 100 members get lifetime free access" or "Limited spots for early beta".
   - Optional: a simple email capture form (just email) below the button for those ready to join.
   - Remove any competing CTAs – only one primary action on the page.

COPYWRITING RULES:
- Use "you" focused language, not "we".
- Benefit-driven headlines, not feature lists.
- Specific numbers and metrics whenever possible.
- Conversational, human tone.
- Power words: "discover", "unlock", "transform", "guarantee", "proven".
- Avoid generic phrases like "high-quality feedback" without explanation.

TECHNICAL REQUIREMENTS:
- Semantic HTML5 structure.
CONVERSION OPTIMIZATION:
- Single, consistent CTA throughout the page
- Frictionless email capture with clear value proposition
- Social proof and urgency elements strategically placed
- FAQ section for common objections (if needed)`;
  }

  /**
   * Формат вывода - JSON с HTML/CSS/JS
   */
  private static getOutputFormatPrompt(): string {
    return `
OUTPUT FORMAT:
Return ONLY valid JSON with this exact structure. Do NOT wrap in markdown code blocks or any other formatting:

{
  "html": "<!DOCTYPE html><html lang='en'><head><meta charset='UTF-8'><meta name='viewport' content='width=device-width,initial-scale=1.0'><title>Generated Landing Page</title><style>[COMPLETE CSS HERE]</style></head><body>[COMPLETE HTML STRUCTURE]</body><script>[OPTIONAL JAVASCRIPT]</script></html>",
  "css": "/* Additional CSS if needed beyond inline styles */",
  "js": "// Optional JavaScript for form handling and smooth scroll only",
  "metadata": {
    "headline": "The main headline used",
    "cta_text": "The primary CTA text",
    "target_audience": "Summary of target audience",
    "estimatedConversionRate": "3-8%",
    "targetAudienceFit": "Excellent",
    "mobileOptimized": true,
    "loadingSpeed": "Fast (<2s)",
    "accessibilityScore": "WCAG AA compliant"
  }
}

CRITICAL INSTRUCTIONS:
- Start your response with { and end with }
- Do NOT include \`\`\`json or any markdown formatting
- Do NOT include explanations before or after the JSON
- HTML must be complete and self-contained
- Include all CSS either inline or in <style> tags (use gradients, shadows, typography scale, spacing). If you also fill the "css" field, add <link rel="stylesheet" href="styles.css"> inside <head> so the external stylesheet loads.
- JavaScript should be minimal and optional (only for form handling and smooth scroll). If you fill the "js" field, add <script src="script.js"></script> before </body> so it loads.
- Design must work on all devices
- Use modern CSS (Grid, Flexbox, Custom Properties, gradients, box-shadow, border-radius)
- Apply the VISUAL DESIGN requirements above: hero with gradient or accent background, cards/shadows, clear hierarchy, accent colors
- Include realistic testimonials and social proof
- Make the CTA prominent and compelling (accent color, padding, hover effect)
- Ensure the design reflects the product hypothesis and looks polished, not plain
- MOST IMPORTANT: The page MUST clearly communicate the unique reciprocity mechanic (give-to-get) and avoid generic "feedback platform" language.`;
  }

  /**
   * Пример использования промпта
   */
  static getExamplePrompt(): string {
    return this.buildGenerationPrompt({
      hypothesis: "We believe that indie developers can validate their app ideas 10x faster using AI-powered user interviews, leading to 80% fewer failed launches",
      problem: "Indie developers waste months building apps that nobody wants, losing time and money on failed projects",
      segment: "Solo developers, indie founders, and small dev teams (1-5 people) building mobile/web apps",
      customPrompt: "Make it colorful and modern, add some subtle animations, focus on the speed benefit"
    });
  }
}