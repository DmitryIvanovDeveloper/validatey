/**
 * Default copy for the landing module. No presenter; view passes labels via props.
 */
export const DEFAULT_LANDING_LABELS = {
  page: {
    philosophy: "We don't do the work for you. Together, we learn to create ideas that truly matter",
  },
  header: {
    logoText: 'Validatey',
    howItWorks: 'How it works',
    validationTypes: 'Validation Types',
  },
  hero: {
    badge: '🚀 Validate your ideas with confidence',
    headline: 'From idea to data.',
    headlineHighlight: 'In days, not months.',
    subheadline:
      'Stop guessing what users want. Get structured feedback from real people, validate your problem, and make data-driven decisions before writing a single line of code.',
    seeHowItWorks: 'See how it works',
    noCreditCard: 'No credit card required',
    resultsInDays: 'Results in 2-3 days',
    validationDashboard: 'Validation Dashboard',
    live: 'Live',
    responseRate: 'Response Rate',
    responses: 'Responses',
    status: 'Status',
    progressToGoal: 'Progress to Goal',
    dashboardPlaceholder: 'Your validation metrics will appear here',
  },
  problem: {
    sectionTitle: 'Building in the dark is risky',
    sectionSubtitle: 'Every founder faces these challenges when trying to validate their ideas',
    problems: [
      { title: 'Reddit roulette', description: 'Your post lives for 2 hours, then disappears with 3 comments' },
      { title: 'Friend feedback', description: "They'll say it's great to be nice, not to help" },
      { title: 'Investor catch-22', description: 'They want data, you have none' },
      { title: 'The big fear', description: 'Months of work on something nobody wants' },
    ] as Array<{ title: string; description: string }>,
  },
  solution: {
    sectionTitle: 'Get answers, not opinions',
    sectionSubtitle: 'Reddit gives opinions, Product Hunt gives attention, but Validatey gives',
    sectionSubtitleHighlight: 'data for decisions',
    solutions: [
      { title: 'Structured feedback', description: '8-40 targeted responses with real data' },
      { title: 'Real numbers', description: "See exactly what % confirm the problem and how much they'll pay" },
      { title: 'Customer emails', description: 'Build your beta list before you build your product' },
      { title: 'Investor-ready reports', description: 'Walk into meetings with data, not just ideas' },
    ] as Array<{ title: string; description: string }>,
  },
  footer: {
    logoText: 'Validatey',
    description: 'Validate your ideas with real data before writing code.',
    product: 'Product',
    resources: 'Resources',
    company: 'Company',
    howItWorks: 'How it works',
    validationTypes: 'Validation Types',
    pricing: 'Pricing',
    caseStudies: 'Case Studies',
    blog: 'Blog',
    helpCenter: 'Help Center',
    community: 'Community',
    apiDocs: 'API Docs',
    about: 'About',
    careers: 'Careers',
    contact: 'Contact',
    partners: 'Partners',
    copyright: '© 2026 Validatey. All rights reserved.',
  },
} as const;

export type LandingLabels = typeof DEFAULT_LANDING_LABELS;
