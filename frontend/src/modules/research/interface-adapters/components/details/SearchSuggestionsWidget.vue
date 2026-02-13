<template>
  <div class="search-suggestions-widget">
    <div v-if="!insights?.results || insights.results.length === 0" class="empty-state">
      <div class="empty-icon">
        <Search class="w-12 h-12" />
      </div>
      <h3 class="empty-title">No Search Data</h3>
      <p class="empty-description">Google Autocomplete suggestions will appear here after research.</p>
    </div>

    <div v-else class="suggestions-content">
      <div class="suggestions-header">
        <h4 class="suggestions-title">What People Are Searching For</h4>
        <p class="suggestions-subtitle">Google Autocomplete insights based on your research topics</p>
      </div>

      <div class="suggestions-list">
        <div
          v-for="result in insights.results"
          :key="result.phrase"
          class="suggestion-item"
        >
          <div class="suggestion-query">
            <div class="query-icon">
              <Hash class="w-5 h-5" />
            </div>
            <span class="query-text">"{{ result.phrase }}"</span>
          </div>

          <div v-if="result.suggestions && result.suggestions.length > 0" class="suggestion-results">
            <div class="suggestions-grid">
              <div
                v-for="suggestion in result.suggestions.slice(0, 6)"
                :key="suggestion"
                class="suggestion-chip"
              >
                {{ suggestion }}
              </div>
            </div>
          </div>

          <div v-else class="no-suggestions">
            <span class="no-suggestions-text">No related searches found</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { Search, Hash } from 'lucide-vue-next';
import type { ResearchCanvas } from '../../../domain/entities/research-canvas.entity';

interface Props {
  insights?: ResearchCanvas['autocompleteInsights'] | null;
}

const props = defineProps<Props>();
</script>

<style scoped>
.search-suggestions-widget {
  width: 100%;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 3rem 2rem;
  text-align: center;
  gap: 1.5rem;
  background: var(--color-bg-subtle);
  border: 1px solid var(--color-border-light);
  border-radius: var(--radius-lg);
  margin: 1rem 0;
}

.empty-icon {
  color: var(--color-text-muted);
  opacity: 0.6;
}

.empty-title {
  font-size: var(--text-lg);
  font-weight: var(--font-weight-semibold);
  color: var(--color-text);
  margin: 0;
}

.empty-description {
  font-size: var(--text-sm);
  color: var(--color-text-muted);
  margin: 0;
  max-width: 300px;
}

.suggestions-content {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.suggestions-header {
  text-align: center;
  margin-bottom: 1rem;
}

.suggestions-title {
  font-size: var(--text-xl);
  font-weight: var(--font-weight-semibold);
  color: var(--color-text);
  margin: 0 0 0.5rem 0;
}

.suggestions-subtitle {
  font-size: var(--text-sm);
  color: var(--color-text-muted);
  margin: 0;
}

.suggestions-list {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.suggestion-item {
  padding: 1.5rem;
  background: var(--color-bg);
  border-radius: var(--radius-lg);
  border: 1px solid var(--color-border-light);
  box-shadow: var(--shadow-sm);
  transition: box-shadow 0.2s;
  margin-bottom: 1rem;
}

.suggestion-item:hover {
  box-shadow: var(--shadow-md);
}

.suggestion-query {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 1rem;
  padding-bottom: 0.75rem;
  border-bottom: 1px solid var(--color-border-light);
}

.query-icon {
  color: var(--color-accent);
  flex-shrink: 0;
}

.query-text {
  font-size: var(--text-lg);
  font-weight: var(--font-weight-semibold);
  color: var(--color-text);
}

.suggestion-results {
  margin-top: 1rem;
}

.suggestions-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 0.75rem;
}

.suggestion-chip {
  padding: 0.625rem 0.875rem;
  background: var(--color-bg-subtle);
  border: 1px solid var(--color-border-light);
  border-radius: var(--radius-md);
  font-size: var(--text-sm);
  color: var(--color-text);
  line-height: 1.4;
  word-break: break-word;
  transition: all 0.2s;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
}

.suggestion-chip:hover {
  background: var(--color-bg);
  border-color: var(--color-border);
  transform: translateY(-1px);
  box-shadow: var(--shadow-sm);
}

.no-suggestions {
  margin-top: 1rem;
  padding: 1.25rem;
  background: var(--color-bg-subtle);
  border: 1px solid var(--color-border-light);
  border-radius: var(--radius-md);
  text-align: center;
}

.no-suggestions-text {
  font-size: var(--text-sm);
  color: var(--color-text-muted);
  font-style: italic;
}

@media (max-width: 640px) {
  .suggestions-grid {
    grid-template-columns: 1fr;
  }

  .suggestion-chip {
    text-align: center;
  }
}
</style>