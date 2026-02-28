/**
 * Tips: What comment analysis CANNOT validate.
 * Used by TipsWidget on the Overview tab.
 */
export interface TipSectionParagraph {
  type: 'p';
  text: string;
}

export interface TipSectionList {
  type: 'list';
  items: string[];
}

export interface TipSectionTable {
  type: 'table';
  headers: string[];
  rows: string[][];
}

export type TipSection = TipSectionParagraph | TipSectionList | TipSectionTable;

export interface Tip {
  id: number;
  title: string;
  sections: TipSection[];
}

export const commentAnalysisTips: Tip[] = [
  {
    id: 1,
    title: '1. Willingness to Pay',
    sections: [
      { type: 'p', text: 'This is the most important limitation. People may actively discuss a problem, complain, or even suggest solutions—but that does not mean they are willing to open their wallet.' },
      {
        type: 'table',
        headers: ['What people say in comments', 'What it does NOT mean'],
        rows: [
          ['"I have the same problem!"', 'They are willing to pay for a solution'],
          ['"Does anyone know a tool for X?"', 'They will buy your tool'],
          ['"Why is there still no app that..."', 'They will become paying customers'],
        ],
      },
      {
        type: 'p',
        text: 'Why: There is a huge gap between recognizing a problem and willingness to pay. People may work around the problem for free, accept it, think it is not worth paying for, or expect a free solution (ad-supported model).',
      },
      { type: 'p', text: 'How to validate: Only through direct actions—pre-orders, deposits, subscriptions.' },
    ],
  },
  {
    id: 2,
    title: '2. Realistic market size (TAM, SAM, SOM)',
    sections: [
      {
        type: 'p',
        text: 'Comments can show that a problem exists, but they do not answer:',
      },
      {
        type: 'table',
        headers: ['What you cannot learn', 'Why'],
        rows: [
          ['How many people have this problem?', 'Comments are the "tip of the iceberg"—the most active users'],
          ['How fast is the market growing?', 'No year-over-year dynamics, only "now"'],
          ['How many would actually buy?', 'See point 1 (willingness to pay)'],
          ['What market share is achievable?', 'No data on competitors and their share'],
        ],
      },
      {
        type: 'p',
        text: 'Research: Even advanced sentiment and volume analysis of Reddit comments shows only weak correlation with real market movements. For market sizing you need other methods: report analysis, representative surveys, search trend data.',
      },
    ],
  },
  {
    id: 3,
    title: '3. Unit economics and pricing',
    sections: [
      { type: 'p', text: 'Comments do not answer:' },
      {
        type: 'table',
        headers: ['Question', 'Why you cannot learn it from comments'],
        rows: [
          ['What price to charge?', 'People mention abstract numbers, not backed by action'],
          ['What is the product cost?', 'Comments do not know your costs'],
          ['How many customers for break-even?', 'No conversion data'],
          ['What is LTV (lifetime value)?', 'No retention data'],
        ],
      },
      {
        type: 'p',
        text: 'People may write: "I would pay $10/month." But they may be the same ones who never pay; in reality they may churn after the first month, or not reflect their actual willingness to pay.',
      },
    ],
  },
  {
    id: 4,
    title: '4. Technical feasibility',
    sections: [
      { type: 'p', text: 'Comments will not answer:' },
      {
        type: 'table',
        headers: ['Question', 'Why'],
        rows: [
          ['Can this be built?', 'Users do not know your constraints'],
          ['How long will development take?', 'They cannot assess complexity'],
          ['What are the technical risks?', 'No expertise in your stack'],
          ['Will the solution scale?', 'They do not see the architecture'],
        ],
      },
      {
        type: 'p',
        text: 'Example: Users may demand a feature that is technically impossible without a full product rewrite. Comments will not show that.',
      },
    ],
  },
  {
    id: 5,
    title: '5. Quality and depth of pain (intensity)',
    sections: [
      { type: 'p', text: 'Comments show that pain exists, but not its intensity:' },
      {
        type: 'table',
        headers: ['Aspect', 'Limitation'],
        rows: [
          ['How much does it affect their life?', 'Hard to gauge from text'],
          ['Are they willing to change behavior?', 'Comments do not show inertia'],
          ['What have they already tried?', 'Only part of it is visible'],
        ],
      },
      {
        type: 'p',
        text: 'Example: Someone may write an emotional comment, but in practice the problem occurs once a year and is not worth solving. Conversely, the silent majority may suffer in silence.',
      },
    ],
  },
  {
    id: 6,
    title: '6. Cause and effect',
    sections: [
      { type: 'p', text: 'Comments show correlation, not causation:' },
      {
        type: 'table',
        headers: ['Interpretation error', 'Example'],
        rows: [
          ['People complain about X → so X is the cause', 'X may be an effect of another problem Y'],
          ['People ask for feature F → so F will increase sales', 'They may not buy even with F'],
          ['Problem is actively discussed → so the market is ready', 'It may be "noise" from a small group'],
        ],
      },
      {
        type: 'p',
        text: 'Research: Sentiment analysis alone has weak predictive power for real market events. Volume and trends work better, but they still do not provide cause-and-effect relationships.',
      },
    ],
  },
  {
    id: 7,
    title: '7. Long-term retention',
    sections: [
      { type: 'p', text: 'Comments may show initial interest, but they do not answer:' },
      {
        type: 'table',
        headers: ['Question', 'Why'],
        rows: [
          ['Will users come back in a month?', 'No behavioral data'],
          ['Will they get tired of the product?', 'Cannot predict from one-off comments'],
          ['What feature will make them stay?', 'Hypothetical answers ≠ real behavior'],
        ],
      },
      {
        type: 'p',
        text: 'Research: Predicting retention requires analyzing real cohort behavior, not text.',
      },
    ],
  },
];
