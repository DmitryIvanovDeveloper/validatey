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

Your design philosophy: "Every pixel should serve the conversion goal. Clear hierarchy and visual interest drive trust; avoid generic, flat, or boring layouts. Social proof beats features. Urgency beats perfection."

You follow current UI/UX trends (2024–2025): clear visual hierarchy, generous whitespace, consistent spacing scale (e.g. 4/8px grid), limited color palette with one primary accent, readable line-length (45–75 chars), obvious focus states and hover feedback, and a hero that doesn't overwhelm (e.g. max-height 70–85vh or min-height with padding, not full viewport unless the fold has one clear CTA). You avoid dated patterns: tiny click targets, cramped text, flat buttons, or hero sections that push content below the fold on small screens.

You understand that landing pages are not about showing everything - they are about getting ONE specific action from ONE specific audience. You always deliver polished, modern, visually rich designs - never plain or minimal to the point of looking unfinished.`;
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

VISUAL DESIGN (MUST HAVE - do not output a plain or boring page):
- Use a distinct hero section: gradient background (e.g. linear-gradient) or strong accent background color, not plain white
- Apply subtle depth: box-shadow on cards/sections, rounded corners (border-radius 8px–16px) where appropriate
- Clear typography hierarchy: at least 2–3 font sizes (e.g. 2rem+ for headline, 1.25rem for subheadings, 1rem for body)
- Section variety: alternate section backgrounds (e.g. light gray vs white) or use cards to separate content
- One or two accent colors for buttons, links, and highlights (avoid single gray/black only)
- Generous spacing: padding 2rem–3rem on sections, margin between elements so the page breathes
- Optional: very subtle CSS animations (e.g. fade-in, or button hover scale) for polish
- AVOID: single flat white background everywhere, one font size, no shadows, no gradients or accents, cramped layout

MODERN UI/UX (apply these so the page feels current and professional):
- Hero height: use min-height (e.g. 60vh–80vh) or max-height (e.g. 85vh) so the first screen shows headline + CTA + a hint of content below; avoid height: 100vh unless the hero is the only fold content. Prefer something like min-height: 70vh; padding: 4rem 2rem; so the block breathes and doesn't dominate the whole page.
- Spacing: use a consistent scale (e.g. 0.5rem, 1rem, 1.5rem, 2rem, 3rem). Section padding 2rem–3rem; gap between sections 0–1rem. Don't cram elements.
- Typography: limit line-length for body text (max-width: 65ch or ~45rem) for readability. Clear hierarchy: one main headline size, one subhead size, one body size.
- Touch targets: buttons and links at least 44px height; padding 0.75rem–1.25rem.
- Color: one primary accent (buttons, links, key highlights); neutral background and text; optional secondary accent for hover or badges. Avoid more than 3–4 colors.
- Interactivity: visible :focus styles (outline or ring), smooth transitions (0.2s) on hover for buttons/links. Optional: subtle fade-in or slide-up on scroll for sections.
- Layout: prefer CSS Grid or Flexbox; avoid fixed pixel widths for content; use max-width on containers (e.g. 1200px) and margin: auto to center.
- Content width (mandatory): wrap main content in a container with max-width: 720px or 65ch and margin: 0 auto so body text does not span the full viewport on large screens. Apply to sections or a main wrapper.
- Alternating section backgrounds (mandatory): use two backgrounds, e.g. #fff and #f5f5f5 or #f9fafb, alternating so each section is visually distinct (problem white, solution gray, testimonials white, etc.).
- Focus styles (mandatory for accessibility): add :focus-visible { outline: 2px solid var(--accent-color); outline-offset: 2px; } or box-shadow for all interactive elements (buttons, links). Do not rely on browser default only.
- Steps / "How it works" (mandatory): style the 3 steps as cards (same treatment as testimonials: border, border-radius, padding, box-shadow) or as numbered circles with text beside them. Do not leave them as plain divs with only headings.

VARIATION (each landing should feel fresh, not a clone):
- Vary the hero: try different gradient directions (e.g. to right, 135deg), different color pairs (e.g. violet/indigo, teal/cyan, warm orange/coral), or a solid accent with subtle pattern. Do NOT always use the same blue-to-green vertical gradient.
- Vary the headline: rephrase the value proposition (e.g. "Swap Reviews, Get Real Feedback" or "Give First, Get Better Feedback") instead of repeating the exact same phrase every time.
- Consider layout variants: hero with two columns (short line of copy left, visual or CTA right), or centered compact hero; not always one centered block.
- Testimonials: use different names, roles, and quote angles; vary the number (3–5) and presentation (cards vs list).

IMAGES AND ASSETS (strict):
- Do NOT use external image URLs (e.g. via.placeholder.com, unsplash.com, or any https://). They are blocked by security policy and will not load.
- For testimonial avatars: use inline data URI only, e.g. a small SVG as data:image/svg+xml,... with a circle and initial letter, or a simple colored circle. Example: <img src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='50' height='50'%3E%3Ccircle cx='25' cy='25' r='25' fill='%236b7280'/%3E%3Ctext x='25' y='32' text-anchor='middle' fill='white' font-size='20'%3EA%3C/text%3E%3C/svg%3E" alt="Name">. Or omit images and use styled initials in a div (e.g. "AC") with CSS border-radius and background.

TYPOGRAPHY AND FONT (mandatory):
- Use one web font from Google Fonts: add a single <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap"> (or DM Sans, Plus Jakarta Sans) in <head>, then set font-family on body (e.g. font-family: 'Inter', sans-serif). Do NOT use only Arial or generic sans-serif.

DESIGN PRINCIPLES:
- Clean, modern, professional but visually rich design
- Mobile-first responsive (320px to 2560px)
- Fast loading, optimized for performance
- Accessible (WCAG 2.1 AA compliant)
- Brand-appropriate color scheme

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
- CSS Grid and Flexbox for layouts.
- Smooth animations and transitions.
- Optimized images and fonts.
- Form validation and submission (if form included, use basic JavaScript to prevent default and show a success message).
- Privacy-friendly design (no tracking required by default).

ADDITIONAL UX BEST PRACTICES:
- Ensure the primary CTA is consistent across the page (same text and destination).
- If using "Join Waitlist" as CTA, all buttons should lead to the same email capture form (either a modal or a section on the page). Do NOT mix "Join Now" and "Join Waitlist".
- Make the email capture form simple (only email field) to reduce friction.
- Consider adding a small FAQ section if common objections arise (optional).`;
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