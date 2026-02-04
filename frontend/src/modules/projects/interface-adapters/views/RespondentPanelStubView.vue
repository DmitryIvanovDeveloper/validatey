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
      <p class="stub-message">Order respondents by region, segment, budget, and SLA (24–48 h). Integration with partner panels (e.g. Respondent, Prolific) or our own panel — coming soon.</p>
      <p class="stub-cta">For now, use <router-link :to="`/projects/${projectId}/invitations`">Invitations</router-link> to send your survey link or upload your own email list.</p>
    </Card>
  </div>
</template>

<script setup lang="ts">
import { useRoute } from 'vue-router';
import PageHeader from '@/shared/components/PageHeader.vue';
import Card from '@/shared/components/Card.vue';

const route = useRoute();
const projectId = route.params.projectId as string;
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
