<template>
  <div class="search-suggestions-tab-view">
    <!-- Search Suggestions -->
    <div class="section-card suggestions-card">
      <div class="section-card-header">
        <span class="section-icon section-icon-search" aria-hidden="true">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="11" cy="11" r="8"/>
            <path d="m21 21-4.35-4.35"/>
          </svg>
        </span>
        <div>
          <h3 class="section-title">Search Suggestions</h3>
          <p class="section-subtitle">What people search for in your market</p>
        </div>
      </div>

      <div v-if="insights?.results?.length" class="suggestions-content">
        <div
          v-for="(result, idx) in insights.results"
          :key="idx"
          class="suggestion-item"
        >
          <h4 class="suggestion-phrase">{{ result.phrase }}</h4>

          <ul v-if="result.suggestions?.length" class="suggestion-list">
            <li
              v-for="(suggestion, i) in result.suggestions"
              :key="i"
              class="suggestion-list-item"
            >
              {{ suggestion }}
            </li>
          </ul>
        </div>
      </div>

      <!-- No data message -->
      <div v-else class="state state-empty">
        <span class="state-icon" aria-hidden="true">🔍</span>
        <p class="state-title">No search suggestions collected yet</p>
        <p class="state-desc">Use "Research market with AI" to gather Google Places autocomplete data.</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
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
}

.section-card:hover {
  box-shadow: var(--shadow-md);
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

.suggestions-content {
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.suggestion-item {
  padding: 1.25rem;
  border: 1px solid var(--color-border-light);
  border-radius: 8px;
  background: var(--color-bg-subtle, #f8fafc);
}

.suggestion-phrase {
  font-size: 1rem;
  font-weight: 600;
  color: var(--color-text, #0f172a);
  margin: 0 0 0.75rem 0;
}

.suggestion-list {
  margin: 0;
  padding: 0;
  list-style: none;
}

.suggestion-list-item {
  padding: 0.375rem 0;
  color: var(--color-text, #0f172a);
  font-size: 0.875rem;
  line-height: 1.5;
  position: relative;
  padding-left: 1.25rem;
}

.suggestion-list-item:before {
  content: '•';
  color: var(--color-accent, #0d9488);
  font-weight: bold;
  position: absolute;
  left: 0;
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