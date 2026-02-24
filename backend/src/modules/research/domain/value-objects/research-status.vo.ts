export type ResearchStatus = 'idle' | 'collecting' | 'synthesizing';

/** If status is collecting/synthesizing longer than this, treat as idle (stale). */
export const RESEARCH_STATUS_STALE_MS = 15 * 60 * 1000; // 15 minutes
