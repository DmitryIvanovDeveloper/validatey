<template>
  <div class="edit-project-view">
    <header class="page-header">
      <nav class="breadcrumb" aria-label="Breadcrumb">
        <router-link :to="`/projects/${projectId}`" class="breadcrumb-link">Project</router-link>
        <span class="breadcrumb-sep">/</span>
        <span class="breadcrumb-current">Edit</span>
      </nav>
      <h1 class="page-title">Edit project</h1>
    </header>

    <div v-if="viewModel.loading.value && !viewModel.project.value" class="loading-state">
      <p>Loading project…</p>
    </div>
    <div v-else-if="viewModel.error.value" class="error-state">
      <p class="error-text">{{ viewModel.error.value }}</p>
      <router-link :to="`/projects/${projectId}`" class="btn btn-secondary">Back to Overview</router-link>
    </div>
    <form v-else-if="project" class="edit-form" @submit.prevent="save">
      <p v-if="saveError" class="form-error">{{ saveError }}</p>
      <p v-if="saveSuccess" class="form-success">Saved. <router-link :to="`/projects/${projectId}`">Back to Overview</router-link></p>

      <section class="form-section" id="segment">
        <h2 class="section-title">Segment & demographics</h2>
        <div class="field">
          <label for="segment-description">Segment description</label>
          <textarea
            id="segment-description"
            v-model="form.segmentDescription"
            rows="3"
            class="input-textarea"
            placeholder="Describe your target segment"
          />
        </div>
        <div class="field">
          <label for="segment-demographics">Demographics</label>
          <textarea
            id="segment-demographics"
            v-model="form.segmentDemographics"
            rows="2"
            class="input-textarea"
            placeholder='e.g. B2B, 25-45, tech sector or JSON: {"role": "PM", "company_size": "50-200"}'
          />
        </div>
      </section>

      <section class="form-section" id="hypothesis">
        <h2 class="section-title">Hypothesis</h2>
        <div class="field">
          <label for="hypothesis-description">Hypothesis description</label>
          <textarea
            id="hypothesis-description"
            v-model="form.hypothesisDescription"
            rows="3"
            class="input-textarea"
            placeholder="What are we validating?"
          />
        </div>
        <div class="field">
          <label>Assumptions</label>
          <div class="assumptions-list">
            <div v-for="(a, i) in form.assumptions" :key="i" class="assumption-row">
              <input v-model="form.assumptions[i]" type="text" class="input-text" placeholder="Assumption" />
              <button type="button" class="btn-remove" aria-label="Remove" @click="removeAssumption(i)">×</button>
            </div>
            <button type="button" class="btn btn-ghost btn-add" @click="addAssumption">+ Add assumption</button>
          </div>
        </div>
      </section>

      <section class="form-section" id="market">
        <h2 class="section-title">Market context (optional)</h2>
        <div class="field">
          <label for="market-picture">Market picture</label>
          <textarea id="market-picture" v-model="form.marketPicture" rows="2" class="input-textarea" placeholder="Brief market overview" />
        </div>
        <div class="field">
          <label for="market-fit">Market fit</label>
          <textarea id="market-fit" v-model="form.marketFit" rows="2" class="input-textarea" placeholder="How your solution fits" />
        </div>
        <div class="field">
          <label for="differentiation">Differentiation</label>
          <textarea id="differentiation" v-model="form.differentiation" rows="2" class="input-textarea" placeholder="What makes you different" />
        </div>
      </section>

      <div class="form-actions">
        <router-link :to="`/projects/${projectId}`" class="btn btn-secondary">Cancel</router-link>
        <Button
          type="submit"
          variant="primary"
          :loading="saving"
          :show-spinner="false"
          text="Save changes"
          :disabled="saving"
        >
          {{ saving ? 'Saving…' : 'Save changes' }}
        </Button>
      </div>
    </form>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, watch, onMounted, nextTick } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { ProjectViewModel } from '../view-models/project.view-model';
import { ProjectPresenter } from '../presenters/project.presenter';
import { container } from '../../../../infrastructure/bootstrap/container';
import { TYPES } from '../../infrastructure/bootstrap/types';
import Button from '../../../../shared/components/atoms/Button.vue';

const route = useRoute();
const router = useRouter();
const projectId = route.params.projectId as string;
const viewModel = new ProjectViewModel();
const presenter = container.get<ProjectPresenter>(TYPES.ProjectPresenter);

const saving = ref(false);
const saveError = ref<string | null>(null);
const saveSuccess = ref(false);

const project = ref(viewModel.project.value);

const form = reactive({
  segmentDescription: '',
  segmentDemographics: '',
  hypothesisDescription: '',
  assumptions: [] as string[],
  marketPicture: '',
  marketFit: '',
  differentiation: '',
});

function getDemographicsText(p: NonNullable<typeof project.value>): string {
  const d = p.segment?.demographics;
  if (!d) return '';
  if (typeof d === 'string') return d;
  try {
    return JSON.stringify(d, null, 2);
  } catch {
    return Object.entries(d)
      .map(([k, v]) => `${k}: ${v}`)
      .join('\n');
  }
}

function syncFormFromProject() {
  const p = viewModel.project.value;
  if (!p) return;
  project.value = p;
  form.segmentDescription = p.segment?.description ?? '';
  form.segmentDemographics = getDemographicsText(p);
  form.hypothesisDescription = p.hypothesis?.description ?? '';
  form.assumptions = Array.isArray(p.hypothesis?.assumptions)
    ? [...p.hypothesis.assumptions]
    : [];
  form.marketPicture = p.marketContext?.marketPicture ?? '';
  form.marketFit = p.marketContext?.marketFit ?? '';
  form.differentiation = p.marketContext?.differentiation ?? '';
}

function addAssumption() {
  form.assumptions.push('');
}

function removeAssumption(i: number) {
  form.assumptions.splice(i, 1);
}

async function save() {
  if (!projectId) return;
  saving.value = true;
  saveError.value = null;
  saveSuccess.value = false;
  try {
    let segmentDemographics: string | Record<string, unknown> = form.segmentDemographics.trim();
    if (segmentDemographics) {
      try {
        segmentDemographics = JSON.parse(segmentDemographics) as Record<string, unknown>;
      } catch {
        segmentDemographics = { text: form.segmentDemographics };
      }
    }
    const marketContext =
      form.marketPicture.trim() || form.marketFit.trim() || form.differentiation.trim()
        ? {
            marketPicture: form.marketPicture.trim() || undefined,
            marketFit: form.marketFit.trim() || undefined,
            differentiation: form.differentiation.trim() || undefined,
          }
        : null;

    const result = await presenter.updateProject(
      projectId,
      undefined,
      form.segmentDescription.trim() || undefined,
      segmentDemographics || undefined,
      form.hypothesisDescription.trim() || undefined,
      form.assumptions.filter(Boolean).length ? form.assumptions.filter(Boolean) : undefined,
      undefined,
      marketContext
    );

    if (result.ok) {
      saveSuccess.value = true;
      await presenter.loadProject(projectId, viewModel);
      syncFormFromProject();
      setTimeout(() => router.push(`/projects/${projectId}`), 1500);
    } else {
      saveError.value = result.error ?? 'Failed to save';
    }
  } catch (e) {
    saveError.value = e instanceof Error ? e.message : 'Failed to save';
  } finally {
    saving.value = false;
  }
}

watch(
  () => viewModel.project.value,
  (p) => {
    if (p) syncFormFromProject();
  },
  { immediate: true }
);

function scrollToHash() {
  const hash = route.hash.replace(/^#/, '');
  if (!hash || !['segment', 'hypothesis', 'market'].includes(hash)) return;
  nextTick(() => {
    const el = document.getElementById(hash);
    el?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  });
}

watch(
  () => [viewModel.project.value, route.hash] as const,
  () => {
    if (viewModel.project.value) scrollToHash();
  }
);

onMounted(async () => {
  if (projectId) {
    await presenter.loadProject(projectId, viewModel);
    syncFormFromProject();
    scrollToHash();
  }
});
</script>

<style scoped>
.edit-project-view {
  max-width: 640px;
  padding: 1.5rem 0;
}
.page-header {
  margin-bottom: 1.5rem;
}
.breadcrumb {
  display: flex;
  align-items: center;
  gap: 0.375rem;
  font-size: 0.8125rem;
  color: var(--color-text-muted);
  margin-bottom: 0.5rem;
}
.breadcrumb-link {
  color: var(--color-accent);
  text-decoration: none;
}
.breadcrumb-link:hover {
  text-decoration: underline;
}
.breadcrumb-sep {
  opacity: 0.5;
}
.breadcrumb-current {
  color: var(--color-text);
  font-weight: 600;
}
.page-title {
  font-size: 1.25rem;
  font-weight: 700;
  margin: 0;
}
.loading-state,
.error-state {
  padding: 2rem;
  text-align: center;
  color: var(--color-text-muted);
}
.error-text {
  color: var(--color-error);
  margin-bottom: 1rem;
}
.form-error {
  color: var(--color-error);
  margin-bottom: 1rem;
}
.form-success {
  color: var(--color-success);
  margin-bottom: 1rem;
}
.form-section {
  margin-bottom: 2rem;
}
.section-title {
  font-size: 1rem;
  font-weight: 600;
  margin: 0 0 1rem 0;
  color: var(--color-text);
}
.field {
  margin-bottom: 1rem;
}
.field label {
  display: block;
  font-size: 0.875rem;
  font-weight: 500;
  margin-bottom: 0.35rem;
  color: var(--color-text);
}
.input-textarea,
.input-text {
  width: 100%;
  padding: 0.5rem 0.75rem;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  font-size: 0.875rem;
  font-family: inherit;
  background: var(--color-bg);
  color: var(--color-text);
}
.input-textarea {
  resize: vertical;
  min-height: 4rem;
}
.assumptions-list {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}
.assumption-row {
  display: flex;
  gap: 0.5rem;
  align-items: center;
}
.assumption-row .input-text {
  flex: 1;
}
.btn-remove {
  flex-shrink: 0;
  width: 2rem;
  height: 2rem;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  background: var(--color-bg);
  color: var(--color-text-muted);
  cursor: pointer;
  font-size: 1.25rem;
  line-height: 1;
  padding: 0;
}
.btn-remove:hover {
  color: var(--color-error);
  border-color: var(--color-error);
}
.btn-add {
  align-self: flex-start;
}
.form-actions {
  display: flex;
  gap: 0.75rem;
  margin-top: 1.5rem;
  padding-top: 1.5rem;
  border-top: 1px solid var(--color-border-light);
}
.btn {
  padding: 0.5rem 1rem;
  border-radius: var(--radius-md);
  font-weight: 500;
  font-size: 0.875rem;
  text-decoration: none;
  display: inline-block;
  border: none;
  cursor: pointer;
  font-family: inherit;
}
.btn-primary {
  background: var(--color-accent);
  color: #fff;
}
.btn-primary:hover:not(:disabled) {
  background: var(--color-accent-hover);
}
.btn-primary:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}
.btn-secondary {
  background: var(--color-bg-subtle);
  color: var(--color-text);
  border: 1px solid var(--color-border);
}
.btn-secondary:hover {
  background: var(--color-border-light);
}
.btn-ghost {
  background: transparent;
  color: var(--color-accent);
  border: 1px dashed var(--color-border);
}
.btn-ghost:hover {
  border-color: var(--color-accent);
}
</style>
