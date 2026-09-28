import test from "node:test";
import assert from "node:assert/strict";

import { parseCustomSelectors } from "./custom-selectors.vo";
import { isScheduleFrequency } from "./schedule-frequency.vo";
import { isScraperSourceType } from "./scraper-source-type.vo";
import { isResearchGoal } from "./research-goal.vo";

test("parseCustomSelectors returns null for invalid payloads", () => {
  assert.equal(parseCustomSelectors(null), null);
  assert.equal(parseCustomSelectors({}), null);
  assert.equal(parseCustomSelectors({ strategy: "xpath", selectors: { title: ".title" } }), null);
  assert.equal(parseCustomSelectors({ strategy: "css", selectors: {} }), null);
});

test("parseCustomSelectors keeps only string selectors and preserves pagination", () => {
  const parsed = parseCustomSelectors({
    strategy: "css",
    selectors: {
      title: ".title",
      score: ".score",
      invalid: 10,
    },
    pagination: ".next",
  });

  assert.deepEqual(parsed, {
    strategy: "css",
    selectors: {
      title: ".title",
      score: ".score",
    },
    pagination: ".next",
  });
});

test("domain value-object guards accept only supported values", () => {
  assert.equal(isScheduleFrequency("daily"), true);
  assert.equal(isScheduleFrequency("hourly"), false);

  assert.equal(isScraperSourceType("custom"), true);
  assert.equal(isScraperSourceType("forum"), false);

  assert.equal(isResearchGoal("market_trends"), true);
  assert.equal(isResearchGoal("unknown_goal"), false);
});
