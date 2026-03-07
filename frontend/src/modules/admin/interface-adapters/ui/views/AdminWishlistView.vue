<template>
  <div class="admin-wishlist-view">
    <div v-if="loading" class="loading-state">
      <LoadingSpots message="Loading wishlist..." size="lg" />
    </div>
    <div v-else-if="error" class="error-state">
      <ErrorDisplay :error="error" />
    </div>
    <div v-else class="wishlist-table-wrap">
      <table class="wishlist-table" role="table">
        <thead>
          <tr>
            <th scope="col">ID</th>
            <th scope="col">Email</th>
            <th scope="col">Added</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="entry in wishlist" :key="entry.id">
            <td class="wishlist-table__id">{{ idShort(entry.id) }}</td>
            <td>{{ entry.email }}</td>
            <td>{{ formatDate(entry.createdAt) }}</td>
          </tr>
        </tbody>
      </table>
      <p v-if="wishlist.length === 0" class="empty-message">No wishlist entries found.</p>
      <p v-else class="count-message">Total: {{ wishlist.length }} entries</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import LoadingSpots from '../../../../../shared/components/LoadingSpots.vue';
import ErrorDisplay from '../../../../../shared/components/ErrorDisplay.vue';
import { API_CONFIG } from '../../../../../infrastructure/config/api.config';
import { container } from '../../../../../infrastructure/bootstrap/container';
import { TYPES as HTTP_TYPES } from '../../../../../infrastructure/bootstrap/types';
import type { HttpClientPort } from '../../../../../infrastructure/http/ports/http-client.port';

interface WishlistEntry {
  id: string;
  email: string;
  createdAt: string;
}

const wishlist = ref<WishlistEntry[]>([]);
const loading = ref(true);
const error = ref<string | null>(null);
const httpClient = container.get<HttpClientPort>(HTTP_TYPES.HttpClient);

function idShort(id: string): string {
  if (id.length <= 8) return id;
  return `${id.slice(0, 4)}…${id.slice(-4)}`;
}

function formatDate(dateString: string): string {
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return dateString;
  }
}

onMounted(async () => {
  try {
    const res = await fetch(`${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.ADMIN_WISHLIST}`, {
      credentials: 'include',
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      error.value = data?.error ?? `Request failed: ${res.status}`;
      return;
    }
    const data = await res.json().catch(() => ({ wishlist: [] }));
    wishlist.value = Array.isArray(data?.wishlist) ? data.wishlist : [];
  } catch (e) {
    error.value = e instanceof Error ? e.message : 'Failed to load wishlist';
  } finally {
    loading.value = false;
  }
});
</script>

<style scoped>
.admin-wishlist-view {
  max-width: 900px;
}

.loading-state,
.error-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.75rem;
  padding: 2rem;
}

.wishlist-table-wrap {
  overflow-x: auto;
  border: var(--border-width) var(--border-style) var(--color-border, #e5e7eb);
  border-radius: 0.5rem;
  background: var(--color-bg, #fff);
}

.wishlist-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.875rem;
}

.wishlist-table th,
.wishlist-table td {
  padding: 0.75rem 1rem;
  text-align: left;
  border-bottom: var(--border-width) var(--border-style) var(--color-border, #e5e7eb);
}

.wishlist-table th {
  font-weight: 600;
  color: var(--color-text-muted, #64748b);
  background: var(--color-bg-subtle, #f8fafc);
}

.wishlist-table tbody tr:last-child td {
  border-bottom: none;
}

.wishlist-table__id {
  font-family: ui-monospace, monospace;
  font-size: 0.8125rem;
}

.empty-message,
.count-message {
  padding: 1.5rem;
  color: var(--color-text-muted, #64748b);
  margin: 0;
}

.count-message {
  font-weight: 500;
}
</style>