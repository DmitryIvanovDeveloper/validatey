<template>
  <div class="respondent-panel-stub">
    <PageHeader
      title="Respondent panel"
      subtitle="Buy audience for your survey"
      :breadcrumbs="[
        { label: 'Projects', path: '/projects' },
        { label: 'Project', path: `/projects/${projectId}` },
        { label: 'Panel' }
      ]"
    />
    <Card title="Buy audience" class="panel-stub-card">
      <p class="stub-message">Order respondents by budget and segment. You will be directed to our partner panel to complete the order.</p>
      <form class="panel-form" @submit.prevent="goToOrder">
        <div class="form-group">
          <label for="panel-budget">Budget</label>
          <select id="panel-budget" v-model="budget" class="form-input">
            <option value="100">$100</option>
            <option value="300">$300</option>
            <option value="500">$500</option>
          </select>
        </div>
        <div class="form-group">
          <label for="panel-segment">Segment</label>
          <select id="panel-segment" v-model="segment" class="form-input">
            <option value="product-managers">Product Managers</option>
            <option value="developers">Developers</option>
            <option value="small-business">Small Business</option>
          </select>
        </div>
        <button type="submit" class="btn btn-primary">Go to order</button>
      </form>
      <p class="stub-cta">Or use <router-link :to="`${projectBase}/invitations`">Invitations</router-link> to send your survey link or upload your own email list.</p>
    </Card>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { useRoute } from 'vue-router';
import PageHeader from '../../../../shared/components/PageHeader.vue';
import Card from '../../../../shared/components/Card.vue';

const RESPONDENT_IO_BASE = 'https://www.respondent.io';

const route = useRoute();
const workspaceId = computed(() => (route.params.workspaceId as string) || '');
const projectId = route.params.projectId as string;
const projectBase = computed(() => `/workspaces/${workspaceId.value}/projects/${projectId}`);

const budget = ref('300');
const segment = ref('product-managers');

function goToOrder() {
  const params = new URLSearchParams({
    budget: budget.value,
    segment: segment.value,
    ...(projectId ? { project_id: projectId } : {}),
  });
  window.open(`${RESPONDENT_IO_BASE}?${params.toString()}`, '_blank', 'noopener,noreferrer');
}
</script>

<style scoped>
.respondent-panel-stub {
  max-width: 640px;
  margin: 0 auto;
  padding: 2rem 1rem;
}

.panel-stub-card {
  margin-top: 1.5rem;
}

.stub-message {
  color: var(--color-text-muted);
  line-height: 1.6;
  margin-bottom: 1rem;
}

.panel-form {
  margin-bottom: 1.5rem;
}

.panel-form .form-group {
  margin-bottom: 1rem;
}

.panel-form .form-group label {
  display: block;
  font-size: 0.9375rem;
  font-weight: 500;
  color: var(--color-text);
  margin-bottom: 0.375rem;
}

.panel-form .form-input {
  width: 100%;
  max-width: 16rem;
  padding: 0.5rem 0.75rem;
  font-size: 1rem;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
}

.panel-form .btn {
  padding: 0.75rem 1.5rem;
  font-weight: 500;
  border-radius: var(--radius-md);
  border: none;
  cursor: pointer;
  background: var(--color-accent);
  color: white;
}

.panel-form .btn:hover {
  background: var(--color-accent-hover);
}

.stub-cta {
  font-size: 0.9375rem;
  color: var(--color-text);
}

.stub-cta a {
  color: var(--color-accent);
  font-weight: 500;
}

.stub-cta a:hover {
  text-decoration: underline;
}
</style>
