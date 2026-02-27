<template>
  <div class="competitors-tab-view">
    <div v-if="canvas?.competitorInfo && (canvas.competitorInfo.competitors?.length || canvas.competitorInfo.priceRange)">
      <!-- Competitive Analysis -->
      <div class="section-card competitors-card">
        <div class="section-card-header">
          <span class="section-icon section-icon-competitors" aria-hidden="true">
            <Users class="w-5 h-5" />
          </span>
          <div>
            <h3 class="section-title">Competitive Analysis</h3>
            <p class="section-subtitle">Key players in your market segment</p>
          </div>
        </div>

        <div class="competitors-content">
          <div class="competitors-list">
            <CompetitorCard
              v-for="competitor in canvas.competitorInfo.competitors"
              :key="competitor"
              :name="competitor"
              positioning="Analysis based on open sources"
              :strengths="['Requires further research']"
              :weaknesses="['Requires further research']"
              price="Under research"
            />
          </div>

          <div v-if="canvas.competitorInfo.priceRange && canvas.competitorInfo.priceRange !== 'Unknown'" class="price-range-section">
            <h4 class="price-range-title">Price Range</h4>
            <p class="price-range-text">{{ canvas.competitorInfo.priceRange }}</p>
          </div>
        </div>
      </div>

      <!-- Gap Analysis -->
      <div class="section-card gap-analysis-card">
        <div class="section-card-header">
          <span class="section-icon section-icon-target" aria-hidden="true">
            <Target class="w-5 h-5" />
          </span>
          <div>
            <h3 class="section-title">Competitive Strategy</h3>
            <p class="section-subtitle">Positioning and differentiation insights</p>
          </div>
        </div>

        <div class="gap-analysis-content">
          <div class="gap-analysis-grid">
            <div class="gap-strategy-item">
              <div class="strategy-icon">
                <Lightbulb class="w-5 h-5" />
              </div>
              <div class="strategy-content">
                <h5 class="strategy-title">Unique Value Proposition</h5>
                <p class="strategy-desc">Define what makes your solution different from competitors</p>
              </div>
            </div>
            <div class="gap-strategy-item">
              <div class="strategy-icon">
                <Target class="w-5 h-5" />
              </div>
              <div class="strategy-content">
                <h5 class="strategy-title">Target Market Focus</h5>
                <p class="strategy-desc">Identify underserved segments and market gaps</p>
              </div>
            </div>
            <div class="gap-strategy-item">
              <div class="strategy-icon">
                <Zap class="w-5 h-5" />
              </div>
              <div class="strategy-content">
                <h5 class="strategy-title">Competitive Advantages</h5>
                <p class="strategy-desc">Leverage your strengths against competitor weaknesses</p>
              </div>
            </div>
            <div class="gap-strategy-item">
              <div class="strategy-icon">
                <TrendingUp class="w-5 h-5" />
              </div>
              <div class="strategy-content">
                <h5 class="strategy-title">Growth Opportunities</h5>
                <p class="strategy-desc">Explore expansion and scaling strategies</p>
              </div>
            </div>
          </div>
        </div>
      </div>
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
      <p class="state-title">No competitor data available yet</p>
      <p class="state-desc">Use "Research market with AI" to find main players and pricing.</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import CompetitorCard from './CompetitorCard.vue';
import { Target, Users, Lightbulb, Zap, TrendingUp } from 'lucide-vue-next';

interface Props {
  canvas?: {
    competitorInfo: {
      competitors?: string[];
      priceRange?: string;
      rating?: string;
    };
  } | null;
}

defineProps<Props>();
</script>

<style scoped>
.competitors-tab-view {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

/* Section cards */
.section-card {
  background: var(--color-bg-page);
  border: 1px solid var(--color-border-light);
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-sm);
  transition: box-shadow 0.2s, border-color 0.2s;
  margin-bottom: 1.5rem;
  padding: 1.5rem;
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

.section-icon-competitors {
  background: rgba(13, 148, 136, 0.1);
}

.section-icon-target {
  background: rgba(139, 92, 246, 0.1);
  color: #7c3aed;
  font-size: 1.25rem;
}

.section-title {
  font-size: 1.125rem;
  font-weight: 600;
  color: var(--color-text, #0f172a);
  margin: 0 0 0.15rem 0;
  letter-spacing: -0.01em;
}


.competitors-content {
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.gap-analysis-content {
  padding: 0;
}

.competitors-list {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.price-range-section {
  padding: 1rem;
  background: var(--color-bg-subtle, #f8fafc);
  border-radius: 8px;
}

.price-range-title {
  font-weight: 600;
  color: var(--color-text, #0f172a);
  margin: 0 0 0.5rem 0;
  font-size: 0.875rem;
}

.price-range-text {
  color: var(--color-text, #0f172a);
  margin: 0;
  font-size: 0.875rem;
  line-height: 1.5;
}

.gap-analysis-content {
  padding: 1.5rem;
}

.gap-analysis-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 1rem;
}

.gap-strategy-item {
  display: flex;
  align-items: flex-start;
  gap: 1rem;
  padding: 1.25rem;
  background: var(--color-bg-subtle, #f8fafc);
  border-radius: 12px;
  border: 1px solid var(--color-border-light);
  transition: box-shadow 0.2s, border-color 0.2s;
}

.gap-strategy-item:hover {
  box-shadow: var(--shadow-sm);
  border-color: var(--color-border);
}

.strategy-icon {
  flex-shrink: 0;
  width: 2.5rem;
  height: 2.5rem;
  background: rgba(13, 148, 136, 0.1);
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.25rem;
}

.strategy-content {
  flex: 1;
}

.strategy-title {
  font-size: 1rem;
  font-weight: 600;
  color: var(--color-text);
  margin: 0 0 0.5rem 0;
  line-height: 1.3;
}

.strategy-desc {
  font-size: 0.875rem;
  color: var(--color-text-muted);
  margin: 0;
  line-height: 1.5;
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
}

.state-empty {
  background: var(--color-bg);
  border: 1px dashed var(--color-border-light);
  border-radius: var(--radius-md);
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