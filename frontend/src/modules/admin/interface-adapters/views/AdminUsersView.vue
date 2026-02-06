<template>
  <div class="admin-users-view">
    <PageHeader
      title="Users"
      subtitle="All registered users (admin only)"
      :breadcrumbs="[{ label: 'Users' }]"
    />

    <div v-if="loading" class="loading-state">
      <LoadingSpinner />
      <p>Loading users...</p>
    </div>
    <div v-else-if="error" class="error-state">
      <ErrorDisplay :error="error" />
    </div>
    <div v-else class="users-table-wrap">
      <table class="users-table" role="table">
        <thead>
          <tr>
            <th scope="col">ID</th>
            <th scope="col">Email</th>
            <th scope="col">Display name</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="u in users" :key="u.id">
            <td class="users-table__id">{{ idShort(u.id) }}</td>
            <td>{{ u.email ?? '—' }}</td>
            <td>{{ u.displayName ?? '—' }}</td>
          </tr>
        </tbody>
      </table>
      <p v-if="users.length === 0" class="empty-message">No users found.</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import PageHeader from '@/shared/components/PageHeader.vue';
import LoadingSpinner from '@/shared/components/LoadingSpinner.vue';
import ErrorDisplay from '@/shared/components/ErrorDisplay.vue';
import { API_CONFIG } from '@/infrastructure/config/api.config';

interface UserRow {
  id: string;
  email: string | null;
  displayName: string | null;
}

const users = ref<UserRow[]>([]);
const loading = ref(true);
const error = ref<string | null>(null);

function idShort(id: string): string {
  if (id.length <= 8) return id;
  return `${id.slice(0, 4)}…${id.slice(-4)}`;
}

onMounted(async () => {
  try {
    const res = await fetch(`${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.ADMIN_USERS}`, {
      credentials: 'include',
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      error.value = data?.error ?? `Request failed: ${res.status}`;
      return;
    }
    const data = await res.json().catch(() => ({ users: [] }));
    users.value = Array.isArray(data?.users) ? data.users : [];
  } catch (e) {
    error.value = e instanceof Error ? e.message : 'Failed to load users';
  } finally {
    loading.value = false;
  }
});
</script>

<style scoped>
.admin-users-view {
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

.users-table-wrap {
  overflow-x: auto;
  border: 1px solid var(--color-border, #e5e7eb);
  border-radius: 0.5rem;
  background: var(--color-bg, #fff);
}

.users-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.875rem;
}

.users-table th,
.users-table td {
  padding: 0.75rem 1rem;
  text-align: left;
  border-bottom: 1px solid var(--color-border, #e5e7eb);
}

.users-table th {
  font-weight: 600;
  color: var(--color-text-muted, #64748b);
  background: var(--color-bg-subtle, #f8fafc);
}

.users-table tbody tr:last-child td {
  border-bottom: none;
}

.users-table__id {
  font-family: ui-monospace, monospace;
  font-size: 0.8125rem;
}

.empty-message {
  padding: 1.5rem;
  color: var(--color-text-muted, #64748b);
  margin: 0;
}
</style>
