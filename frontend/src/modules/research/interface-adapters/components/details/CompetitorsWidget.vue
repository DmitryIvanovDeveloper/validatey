<template>
  <div class="competitors-widget">
    <div v-if="!competitorInfo || (!competitorInfo.competitors?.length && !competitorInfo.priceRange && !competitorInfo.rating)" class="empty-state">
      <div class="empty-icon">
        <Users class="w-12 h-12" />
      </div>
      <h3 class="empty-title">No Competitor Data Available</h3>
      <p class="empty-description">Start research to discover competitor information and market positioning.</p>
    </div>

    <div v-else class="competitors-content">
      <!-- Competitors List -->
      <div v-if="competitorInfo.competitors?.length" class="competitors-section">
        <div class="section-header">
          <Building2 class="section-icon" />
          <h4 class="section-title">Identified Competitors</h4>
        </div>
        <div class="competitors-list">
          <div
            v-for="competitor in competitorInfo.competitors"
            :key="competitor"
            class="competitor-item"
          >
            <span class="competitor-name">{{ competitor }}</span>
          </div>
        </div>
      </div>

      <!-- Price Range -->
      <div v-if="competitorInfo.priceRange && competitorInfo.priceRange !== 'Unknown'" class="competitors-section">
        <div class="section-header">
          <DollarSign class="section-icon" />
          <h4 class="section-title">Price Range</h4>
        </div>
        <p class="price-range">{{ competitorInfo.priceRange }}</p>
      </div>

      <!-- Price Range (Unknown) -->
      <div v-else-if="competitorInfo.priceRange === 'Unknown'" class="competitors-section">
        <div class="section-header">
          <DollarSign class="section-icon" />
          <h4 class="section-title">Price Range</h4>
        </div>
        <p class="price-range unknown">Price range information not available</p>
      </div>

      <!-- Rating -->
      <div v-if="competitorInfo.rating && competitorInfo.rating !== 'N/A'" class="competitors-section">
        <div class="section-header">
          <Star class="section-icon" />
          <h4 class="section-title">Market Rating</h4>
        </div>
        <div class="rating-display">
          <div class="rating-stars">
            <Star
              v-for="i in 5"
              :key="i"
              :class="['star', { filled: i <= Math.floor(parseFloat(competitorInfo.rating) || 0) }]"
              class="w-5 h-5"
            />
          </div>
          <span class="rating-value">{{ competitorInfo.rating }}/5</span>
        </div>
      </div>

      <!-- Rating (N/A) -->
      <div v-else-if="competitorInfo.rating === 'N/A'" class="competitors-section">
        <div class="section-header">
          <Star class="section-icon" />
          <h4 class="section-title">Market Rating</h4>
        </div>
        <p class="rating-na">Market rating information not available</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { watch } from 'vue';
import { Users, DollarSign, Star, Building2 } from 'lucide-vue-next';
import type { ResearchCanvas } from '../../../domain/entities/research-canvas.entity';

interface Props {
  competitorInfo?: ResearchCanvas['competitorInfo'] | null;
}

const props = defineProps<Props>();
</script>

<style scoped>
.competitors-widget {
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

.competitors-content {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.competitors-section {
  background: var(--color-bg);
  border: 1px solid var(--color-border-light);
  border-radius: var(--radius-lg);
  padding: 1.5rem;
  box-shadow: var(--shadow-sm);
  transition: box-shadow 0.2s;
}

.competitors-section:hover {
  box-shadow: var(--shadow-md);
}

.section-header {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 1rem;
  padding-bottom: 0.75rem;
  border-bottom: 1px solid var(--color-border-light);
}

.section-icon {
  width: 1.25rem;
  height: 1.25rem;
  color: var(--color-accent);
  flex-shrink: 0;
}

.section-title {
  font-size: var(--text-lg);
  font-weight: var(--font-weight-semibold);
  color: var(--color-text);
  margin: 0;
}

.competitors-list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 0.75rem;
}

.competitor-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem 1rem;
  background: var(--color-accent-bg);
  color: var(--color-accent);
  border: 1px solid var(--color-accent-light);
  border-radius: var(--radius-md);
  font-size: var(--text-sm);
  font-weight: var(--font-weight-medium);
  transition: all 0.2s;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
}

.competitor-item:hover {
  background: var(--color-accent-light);
  transform: translateY(-1px);
  box-shadow: var(--shadow-sm);
}

.competitor-name {
  flex: 1;
  min-width: 0;
}

.price-range {
  font-size: var(--text-base);
  color: var(--color-text);
  margin: 0;
  padding: 1.25rem;
  background: var(--color-bg-subtle);
  border: 1px solid var(--color-border-light);
  border-radius: var(--radius-md);
  font-weight: var(--font-weight-medium);
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
}

.price-range.unknown {
  color: var(--color-text-muted);
  font-style: italic;
  background: var(--color-bg);
  border-color: var(--color-border-light);
}

.rating-na {
  font-size: var(--text-base);
  color: var(--color-text-muted);
  font-style: italic;
  margin: 0;
  padding: 1.25rem;
  background: var(--color-bg);
  border: 1px solid var(--color-border-light);
  border-radius: var(--radius-md);
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
}

.rating-display {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1.25rem;
  background: var(--color-bg-subtle);
  border: 1px solid var(--color-border-light);
  border-radius: var(--radius-md);
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
}

.rating-stars {
  display: flex;
  gap: 0.25rem;
}

.star {
  color: var(--color-text-muted);
  transition: color 0.2s;
}

.star.filled {
  color: #fbbf24;
}

.rating-value {
  font-size: var(--text-lg);
  font-weight: var(--font-weight-bold);
  color: var(--color-text);
}

@media (max-width: 768px) {
  .competitors-section {
    padding: 1rem;
  }

  .competitors-list {
    grid-template-columns: 1fr;
  }

  .competitor-item {
    padding: 0.625rem 0.875rem;
  }

  .price-range,
  .rating-na,
  .rating-display {
    padding: 1rem;
  }

  .section-header {
    margin-bottom: 0.875rem;
    padding-bottom: 0.5rem;
  }
}
</style>