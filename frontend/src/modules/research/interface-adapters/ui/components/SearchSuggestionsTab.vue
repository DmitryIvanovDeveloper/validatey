<template>
  <div class="search-suggestions-tab-view">
    <!-- Search Suggestions -->
    <div class="section-card suggestions-card">
      <div class="section-card-header">
          <span class="section-icon section-icon-search" aria-hidden="true">
            <Search class="w-5 h-5" />
          </span>
        <div>
          <h3 class="section-title">Search Suggestions</h3>
          <p class="section-subtitle">What people search for in your market</p>
        </div>
      </div>

      <div v-if="insights?.results?.length" class="suggestions-content">
        <div class="suggestions-header">
          <h4 class="suggestions-title">
            <Search class="w-5 h-5 mr-2" />
            User Search Intent
          </h4>
          <p class="suggestions-subtitle">What people are searching for in your market</p>
        </div>

        <div class="suggestions-grid">
          <div
            v-for="(result, idx) in insights.results.slice(0, 6)"
            :key="idx"
            class="suggestion-card"
          >
            <div class="suggestion-header">
              <span class="suggestion-icon">🔎</span>
              <h5 class="suggestion-phrase">{{ result.phrase }}</h5>
            </div>

            <div v-if="result.suggestions?.length" class="suggestion-results">
              <div class="suggestion-count">{{ result.suggestions.length }} related searches</div>
              <ul class="suggestion-list">
                <li
                  v-for="(suggestion, i) in result.suggestions.slice(0, 3)"
                  :key="i"
                  class="suggestion-list-item"
                >
                  {{ suggestion }}
                </li>
                <li v-if="result.suggestions.length > 3" class="suggestion-more">
                  +{{ result.suggestions.length - 3 }} more...
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      <!-- No data message -->
      <div v-else class="state state-empty">
        <span class="state-icon" aria-hidden="true">
          <Search class="w-8 h-8" />
        </span>
        <p class="state-title">No search suggestions collected yet</p>
        <p class="state-desc">Use "Research market with AI" to gather Google Places autocomplete data.</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { Search } from 'lucide-vue-next';

interface Props {
  insights?: {
    searchPhrases: string[];
    results: ReadonlyArray<{ phrase: string; suggestions: string[] }>;
  } | null;
}

defineProps<Props>();
</script>

<style scoped>
.search-suggestions-tab-view {
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
  padding: 1.5rem;
}

.section-card:hover {
  box-shadow: var(--shadow-md);
}

.section-card-header {
  display: flex;
  align-items: flex-start;
  gap: 1rem;
  margin: -1.5rem -1.5rem 1.5rem -1.5rem;
  padding: 0.5rem 1.5rem 1.5rem 1.5rem;
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


.suggestions-content {
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.suggestions-header {
  padding-bottom: 1rem;
  border-bottom: 1px solid var(--color-border-light);
}

.suggestions-title {
  font-size: 1.25rem;
  font-weight: 600;
  color: var(--color-text);
  margin: 0 0 0.5rem 0;
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.suggestions-title .w-5 {
  flex-shrink: 0;
}

.suggestions-subtitle {
  font-size: 0.9375rem;
  color: var(--color-text-muted);
  margin: 0;
  line-height: 1.5;
}

.suggestions-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
  gap: 1.25rem;
}

.suggestion-card {
  background: var(--color-bg);
  border: 1px solid var(--color-border-light);
  border-radius: 12px;
  padding: 1.25rem;
  box-shadow: var(--shadow-sm);
  transition: box-shadow 0.2s, border-color 0.2s;
}

.suggestion-card:hover {
  box-shadow: var(--shadow-md);
  border-color: var(--color-border);
}

.suggestion-header {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 1rem;
}

.suggestion-icon {
  width: 2rem;
  height: 2rem;
  background: rgba(13, 148, 136, 0.1);
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1rem;
  flex-shrink: 0;
}

.suggestion-phrase {
  font-size: 1rem;
  font-weight: 600;
  color: var(--color-text);
  margin: 0;
  line-height: 1.3;
}

.suggestion-results {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.suggestion-count {
  font-size: 0.8125rem;
  color: var(--color-text-muted);
  font-weight: 500;
}

.suggestion-list {
  margin: 0;
  padding: 0;
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.suggestion-list-item {
  font-size: 0.875rem;
  color: var(--color-text);
  line-height: 1.4;
  position: relative;
  padding-left: 1rem;
}

.suggestion-list-item:before {
  content: '•';
  color: var(--color-accent);
  font-weight: bold;
  position: absolute;
  left: 0;
  top: 0;
}

.suggestion-more {
  font-size: 0.8125rem;
  color: var(--color-text-muted);
  font-style: italic;
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
</style>