import { ref } from 'vue';
import type { ScraperSource } from '../../domain/entities/scraper-source.entity';
import type { ScraperRun } from '../../domain/entities/scraper-run.entity';
import type { ScraperStats, ScraperPresets } from '../../application/ports/scraper-api.port';

export class ScraperViewModel {
  sources = ref<ScraperSource[]>([]);
  runs = ref<ScraperRun[]>([]);
  stats = ref<ScraperStats>({
    sourcesCount: 0,
    runsCount: 0,
    runsWithInsightsCount: 0,
  });
  presets = ref<ScraperPresets | null>(null);

  loadError = ref<string | null>(null);
  /** Field-level validation errors from API (e.g. { customSelectors: "...", urls: "..." }). */
  fieldErrors = ref<Record<string, string> | null>(null);
  addLoading = ref(false);
  runLoading = ref<string | null>(null);
  suggestLoading = ref(false);
  insightsLoading = ref<string | null>(null);
}
