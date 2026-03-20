<template>
  <div class="waitlist-widget">
    <div class="waitlist-widget__header">
      <h3 class="waitlist-widget__title">Waitlist</h3>
      <span v-if="!loading && !error" class="waitlist-widget__count">{{ entries.length }} subscribed</span>
    </div>

    <div v-if="loading" class="waitlist-widget__loading">
      <LoadingSpots message="Loading..." size="md" />
    </div>

    <div v-else-if="error" class="waitlist-widget__error">
      <p class="waitlist-widget__error-text">{{ error }}</p>
      <button type="button" class="waitlist-widget__retry" @click="load">Try again</button>
    </div>

    <div v-else class="waitlist-widget__list-wrap">
      <ul v-if="entries.length" class="waitlist-widget__list" role="list">
        <li
          v-for="entry in visibleEntries"
          :key="entry.id"
          class="waitlist-widget__item"
        >
          <span class="waitlist-widget__email">{{ entry.email }}</span>
        </li>
      </ul>
      <div v-if="entries.length > PREVIEW_COUNT" class="waitlist-widget__show-more-wrap">
        <button
          type="button"
          class="waitlist-widget__show-more-btn"
          @click="expanded = !expanded"
        >
          {{ expanded ? 'Show less' : `Show more (${entries.length - PREVIEW_COUNT} more)` }}
          <svg
            class="waitlist-widget__show-more-icon"
            :class="{ 'waitlist-widget__show-more-icon--expanded': expanded }"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            stroke-width="2"
            stroke="currentColor"
          >
            <path stroke-linecap="round" stroke-linejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
        </button>
      </div>
      <p v-if="!entries.length" class="waitlist-widget__empty">No one has subscribed yet. Share your landing page to grow the waitlist.</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue';
import { container } from '@/infrastructure/bootstrap/container';
import { TYPES } from '@/modules/wishlist/infrastructure/bootstrap/types';
import type { WishlistPresenter } from '@/modules/wishlist/interface-adapters/presenters/wishlist.presenter';
import type { WishlistEntry } from '@/modules/wishlist/domain/entities/wishlist.entity';
import LoadingSpots from '@/shared/components/LoadingSpots.vue';

const PREVIEW_COUNT = 8;

const props = defineProps<{
  projectId: string;
}>();

const wishlistPresenter = container.get<WishlistPresenter>(TYPES.WishlistPresenter);

const loading = ref(true);
const error = ref<string | null>(null);
const entries = ref<WishlistEntry[]>([]);
const expanded = ref(false);

const visibleEntries = computed(() => {
  const list = entries.value;
  if (expanded.value || list.length <= PREVIEW_COUNT) return list;
  return list.slice(0, PREVIEW_COUNT);
});

async function load() {
  if (!props.projectId) return;
  loading.value = true;
  error.value = null;
  expanded.value = false;
  const result = await wishlistPresenter.loadListByProject(props.projectId);
  entries.value = result.entries;
  if (result.error) error.value = result.error;
  loading.value = false;
}

onMounted(() => load());
watch(() => props.projectId, () => load(), { immediate: false });
</script>

<style scoped>
.waitlist-widget {
  border-radius: 0.75rem;
  border: 1px solid var(--color-border, #e5e7eb);
  padding: 1.25rem 1.5rem;
}

.waitlist-widget__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 1rem;
}

.waitlist-widget__title {
  font-size: 1rem;
  font-weight: 600;
  color: var(--color-text, #111827);
  margin: 0;
}

.waitlist-widget__count {
  font-size: 0.875rem;
  color: var(--color-text-muted, #6b7280);
}

.waitlist-widget__loading,
.waitlist-widget__error {
  padding: 1rem 0;
  text-align: center;
}

.waitlist-widget__loading-text {
  font-size: 0.875rem;
  color: var(--color-text-muted, #6b7280);
  margin: 0;
}

.waitlist-widget__error-text {
  font-size: 0.875rem;
  color: var(--color-error, #dc2626);
  margin: 0 0 0.5rem;
}

.waitlist-widget__retry {
  font-size: 0.875rem;
  padding: 0.375rem 0.75rem;
  background: var(--color-surface, #f3f4f6);
  border: 1px solid var(--color-border, #e5e7eb);
  border-radius: 0.5rem;
  cursor: pointer;
  color: var(--color-text, #374151);
}

.waitlist-widget__retry:hover {
  background: var(--color-surface-hover, #e5e7eb);
}

.waitlist-widget__list {
  list-style: none;
  margin: 0;
  padding: 0;
  max-height: 16rem;
  overflow-y: auto;
}

.waitlist-widget__item {
  padding: 0.5rem 0;
  border-bottom: 1px solid var(--color-border, #e5e7eb);
  font-size: 0.875rem;
}

.waitlist-widget__item:last-child {
  border-bottom: none;
}

.waitlist-widget__email {
  color: var(--color-text, #111827);
  word-break: break-all;
}

.waitlist-widget__show-more-wrap {
  margin-top: 0.5rem;
  padding-top: 0.5rem;
  border-top: 1px solid var(--color-border-subtle, #f3f4f6);
}

.waitlist-widget__show-more-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.375rem;
  width: 100%;
  padding: 0.5rem 0.75rem;
  font-size: 0.875rem;
  color: var(--color-primary, #0d9488);
  background: transparent;
  border: 1px solid var(--color-border, #e5e7eb);
  border-radius: 0.5rem;
  cursor: pointer;
  transition: background 0.15s, color 0.15s;
}

.waitlist-widget__show-more-btn:hover {
  background: var(--color-surface-hover, #f0fdfa);
  color: var(--color-primary-dark, #0f766e);
}

.waitlist-widget__show-more-icon {
  width: 1rem;
  height: 1rem;
  flex-shrink: 0;
  transition: transform 0.2s;
}

.waitlist-widget__show-more-icon--expanded {
  transform: rotate(180deg);
}

.waitlist-widget__empty {
  font-size: 0.875rem;
  color: var(--color-text-muted, #6b7280);
  margin: 0;
  padding: 0.5rem 0;
}
</style>
