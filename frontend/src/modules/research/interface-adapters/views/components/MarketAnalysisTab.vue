<template>
  <div class="market-analysis-tab-view">
    <!-- Market Research -->
    <div class="section-card research-card">
      <div class="section-card-header">
        <span class="section-icon section-icon-search" aria-hidden="true">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="11" cy="11" r="8"/>
            <path d="m21 21-4.35-4.35"/>
          </svg>
        </span>
        <div>
          <h3 class="section-title">Market Research</h3>
          <p class="section-subtitle">Gather market intelligence with AI</p>
        </div>
      </div>

      <div class="research-form">
        <div class="input-with-button">
          <div class="input-wrapper">
            <span class="input-icon" aria-hidden="true">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <circle cx="11" cy="11" r="8"/>
                <path d="m21 21-4.35-4.35"/>
              </svg>
            </span>
            <input
              v-model="searchQuery"
              type="text"
              placeholder="Ask about industry trends, market size, competitors..."
              class="input-field"
              :disabled="isSearching"
            />
          </div>
          <button
            @click="handleSearch"
            :disabled="isSearching || !searchQuery.trim()"
            class="btn btn-primary"
          >
            {{ isSearching ? 'Searching...' : 'Research' }}
          </button>
        </div>
      </div>
    </div>

    <!-- Market Insights -->
    <div v-if="hasMarketData" class="market-insights-grid">
      <InsightCard
        v-if="canvas.marketData.size"
        :icon="TrendingUp"
        title="Market Size"
        :content="canvas.marketData.size"
        source="AI Research"
      />
      <InsightCard
        v-if="canvas.marketData.growth"
        :icon="TrendingUp"
        title="Market Growth"
        :content="canvas.marketData.growth"
        source="Market Analysis"
      />
      <InsightCard
        v-if="canvas.marketData.trends?.length"
        :icon="FileText"
        title="Key Trends"
        :content="canvas.marketData.trends.join('. ')"
        source="Industry Research"
      />
      <InsightCard
        v-if="marketInsightText"
        :icon="Users"
        title="Recommendations"
        :content="marketInsightText"
        source="AI Analysis"
      />
    </div>

    <!-- No data message -->
    <div v-else class="state state-empty">
      <span class="state-icon" aria-hidden="true">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <line x1="12" y1="20" x2="12" y2="10"/>
          <line x1="18" y1="20" x2="18" y2="4"/>
          <line x1="6" y1="20" x2="6" y2="16"/>
          <path d="M4 12h16"/>
        </svg>
      </span>
      <p class="state-title">No market data available yet</p>
      <p class="state-desc">Use the search above to gather market intelligence with AI.</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import { TrendingUp, Users, Search, FileText } from 'lucide-vue-next';
import InsightCard from './InsightCard.vue';
import type { ResearchCanvas } from '../../domain/entities/research-canvas.entity';

interface Props {
  canvas?: ResearchCanvas | null;
}

const props = defineProps<Props>();

// Computed properties
const hasMarketData = computed(() => {
  const data = props.canvas?.marketData;
  return !!(data && (data.size !== undefined || data.growth !== undefined || (data.trends && data.trends.length > 0)));
});

const searchQuery = ref('');
const isSearching = ref(false);

// Computed
const marketInsightText = computed(() => {
  if (!props.canvas?.marketData?.growth) return '';
  const g = props.canvas.marketData.growth;
  if (/\d+\s*%/.test(g)) return `Recommend validating demand in your segment.`;
  return '';
});

// Methods
const handleSearch = () => {
  if (!searchQuery.value.trim()) return;
  isSearching.value = true;
  // Here would be the API call to search
  setTimeout(() => {
    isSearching.value = false;
  }, 2000);
};
</script>

<style scoped>
.market-analysis-tab-view {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

/* Section cards */
.section-card {
  background: var(--color-bg);
  border: 1px solid var(--color-border-light);
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-sm);
  transition: box-shadow 0.2s, border-color 0.2s;
  margin-bottom: 1.5rem;
}

.section-card:hover {
  box-shadow: var(--shadow-md);
}

.section-card:last-child {
  margin-bottom: 0;
}

.section-card-header {
  display: flex;
  align-items: flex-start;
  gap: 1rem;
  padding: 1.5rem;
  border-bottom: 1px solid var(--color-border-light);
}

.section-icon {
  flex-shrink: 0;
  width: 40px;
  height: 40px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--color-accent, #0d9488);
}

.section-icon-search {
  background: rgba(13, 148, 136, 0.1);
}

.section-title {
  font-size: 1.125rem;
  font-weight: 600;
  color: var(--color-text, #0f172a);
  margin: 0 0 0.15rem 0;
  letter-spacing: -0.01em;
}

.section-subtitle {
  font-size: 0.8125rem;
  color: var(--color-text-muted, #64748b);
  margin: 0;
  line-height: 1.4;
}

.research-form {
  padding: 1.5rem;
}

.input-with-button {
  display: flex;
  gap: 0.75rem;
  align-items: center;
}

.input-wrapper {
  flex: 1;
  position: relative;
}

.input-icon {
  position: absolute;
  left: 1rem;
  top: 50%;
  transform: translateY(-50%);
  width: 1.25rem;
  height: 1.25rem;
  color: var(--color-text-muted);
  z-index: 1;
}

.input-field {
  width: 100%;
  padding: 0.75rem 1rem 0.75rem 3rem;
  border: 1px solid var(--color-border-light);
  border-radius: 10px;
  font-size: 0.9375rem;
  font-family: inherit;
  color: var(--color-text);
  background: var(--color-bg);
  transition: border-color 0.2s, box-shadow 0.2s;
}

.input-field:focus {
  outline: none;
  border-color: var(--color-accent, #0d9488);
  box-shadow: 0 0 0 3px rgba(13, 148, 136, 0.12);
}

.input-field:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn {
  display: inline-flex;
  align-items: center;
  gap: 0.375rem;
  padding: 0.625rem 1.25rem;
  border-radius: 10px;
  font-weight: 500;
  font-size: 0.9375rem;
  cursor: pointer;
  border: none;
  transition: background 0.2s, box-shadow 0.2s, color 0.2s;
}

.btn-primary {
  background: var(--color-accent, #0d9488);
  color: #fff;
}

.btn-primary:hover:not(:disabled) {
  background: var(--color-accent-hover, #0f766e);
  box-shadow: 0 2px 8px rgba(13, 148, 136, 0.25);
}

.btn-primary:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

.market-insights-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 1rem;
}

/* States */
.state {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.75rem;
  padding: 2.5rem 1.5rem;
  font-size: 0.9375rem;
  text-align: center;
  flex-direction: column;
  background: var(--color-bg);
  border: 1px dashed var(--color-border-light);
  border-radius: var(--radius-md);
}

.state-empty {
  color: var(--color-text-muted);
}

.state-icon {
  font-size: 2rem;
}

.state-title {
  font-weight: 600;
  color: var(--color-text, #0f172a);
  margin: 0.5rem 0 0.25rem 0;
}

.state-desc {
  color: var(--color-text-muted, #64748b);
  margin: 0;
  font-size: 0.875rem;
}

@media (max-width: 768px) {
  .input-with-button {
    flex-direction: column;
    align-items: stretch;
  }

  .market-insights-grid {
    grid-template-columns: 1fr;
  }
}
</style>