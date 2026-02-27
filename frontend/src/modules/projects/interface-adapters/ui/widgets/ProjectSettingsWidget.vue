<template>
  <div class="project-settings-widget">
    <div class="settings-header">
      <h3 class="settings-title">{{ labels.settingsTitle }}</h3>
    </div>

    <div class="settings-content">
      <div class="setting-item">
        <label class="setting-label">{{ labels.settingsProjectNameLabel }}</label>
        <input
          v-model="localName"
          @blur="updateName"
          @keyup.enter="updateName"
          class="setting-input"
          :placeholder="labels.settingsProjectNamePlaceholder"
        />
      </div>

      <div class="setting-item">
        <label class="setting-label">{{ labels.settingsSegmentLabel }}</label>
        <textarea
          v-model="localDescription"
          @blur="updateDescription"
          class="setting-textarea"
          :placeholder="labels.settingsSegmentPlaceholder"
          rows="3"
        ></textarea>
      </div>

      <div v-if="loading" class="loading-indicator">
        <svg class="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        <span class="loading-text">{{ labels.settingsUpdating }}</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from 'vue';
import { container } from '../../../../../infrastructure/bootstrap/container';
import { ProjectPresenter } from '../../presenters/project.presenter';
import { TYPES } from '../../../infrastructure/bootstrap/types';

interface Props {
  projectId: string;
}

const props = defineProps<Props>();

const projectPresenter = container.get<ProjectPresenter>(TYPES.ProjectPresenter);
const labels = projectPresenter.labels;

const loading = ref(false);
const localName = ref('');
const localDescription = ref('');

const loadProject = async () => {
  try {
    const result = await projectPresenter.getProject(props.projectId);
    if (result.project) {
      localName.value = result.project.name || '';
      localDescription.value = result.project.segmentDescription || '';
    }
  } catch (error) {
    console.error('Failed to load project:', error);
  }
};

const updateName = async () => {
  if (!localName.value.trim()) return;

  try {
    loading.value = true;
    await projectPresenter.updateProject(
      props.projectId,
      localName.value.trim(),
      undefined // segmentDescription
    );
  } catch (error) {
    console.error('Failed to update project name:', error);
    await loadProject();
  } finally {
    loading.value = false;
  }
};

const updateDescription = async () => {
  try {
    loading.value = true;
    await projectPresenter.updateProject(
      props.projectId,
      undefined, // name
      localDescription.value.trim()
    );
  } catch (error) {
    console.error('Failed to update project description:', error);
    await loadProject();
  } finally {
    loading.value = false;
  }
};

onMounted(() => {
  loadProject();
});

watch(() => props.projectId, () => {
  loadProject();
});
</script>

<style scoped>
.project-settings-widget {
  @apply bg-white rounded-lg border border-gray-200 p-6;
}

.settings-header {
  @apply border-b border-gray-200 pb-4 mb-4;
}

.settings-title {
  @apply text-lg font-semibold text-gray-900;
}

.settings-content {
  @apply space-y-4;
}

.setting-item {
  @apply space-y-2;
}

.setting-label {
  @apply block text-sm font-medium text-gray-700;
}

.setting-input, .setting-textarea {
  @apply w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500;
}

.setting-textarea {
  @apply resize-vertical min-h-[80px];
}

.loading-indicator {
  @apply flex items-center space-x-2 text-blue-600;
}

.loading-text {
  @apply text-sm;
}
</style>
