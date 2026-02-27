<template>
  <div class="show-details-widget">
    <!-- Modal -->
    <div v-if="isModalOpen" class="modal-overlay" @click="closeModal">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <div class="modal-title-section">
            <FileText class="modal-icon" />
            <h2 class="modal-title">Research Details</h2>
          </div>
          <button @click="closeModal" class="modal-close">
            <X class="w-5 h-5" />
          </button>
        </div>

        <div class="modal-body">
          <div class="details-tabs">
            <button
              v-for="tab in tabs"
              :key="tab.id"
              @click="activeTab = tab.id"
              :class="['tab-button', { active: activeTab === tab.id }]"
            >
              <component :is="tab.icon" class="tab-icon" />
              {{ tab.label }}
            </button>
          </div>

          <div class="tab-content">
            <!-- Canvas loading indicator -->
            <div v-if="canvasLoading && activeTab !== 'synthesis'" class="canvas-loading">
              <LoadingSpots message="Loading research data…" size="md" />
            </div>

            <!-- Early Signals -->
            <div v-else-if="activeTab === 'signals'" class="tab-pane">
              <EarlySignalsWidget
                :project-id="projectId"
                :early-signals="mergedResearchData?.canvas?.earlySignals || null"
              />
            </div>

            <!-- Competitors -->
            <div v-else-if="activeTab === 'competitors'" class="tab-pane">
              <CompetitorsWidget
                :competitor-info="mergedResearchData?.canvas?.competitorInfo || null"
              />
            </div>

            <!-- Search Suggestions -->
            <div v-else-if="activeTab === 'search'" class="tab-pane">
              <SearchSuggestionsWidget
                :insights="mergedResearchData?.canvas?.autocompleteInsights || null"
              />
            </div>

            <!-- User Signals -->
            <div v-else-if="activeTab === 'user-signals'" class="tab-pane">
              <UserSignalsWidget
                :insights="mergedResearchData?.canvas?.userInsights || null"
                :project-id="projectId"
              />
            </div>

            <!-- Synthesis -->
            <div v-if="activeTab === 'synthesis'" class="tab-pane">
              <SynthesisWidget
                :report="mergedResearchData?.synthesisReport || null"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import { Zap, Users, Search, MapPin, FileText, X } from 'lucide-vue-next';
import LoadingSpots from '../../../../shared/components/LoadingSpots.vue';
import type { ResearchData, ResearchDataProp, TabItem } from '../../domain/types/research.types';
import type { ResearchCanvas } from '../../domain/entities/research-canvas.entity';
import EarlySignalsWidget from './EarlySignalsWidget.vue';
import CompetitorsWidget from './details/CompetitorsWidget.vue';
import SearchSuggestionsWidget from './details/SearchSuggestionsWidget.vue';
import UserSignalsWidget from './details/UserSignalsWidget.vue';
import SynthesisWidget from './details/SynthesisWidget.vue';
import { API_CONFIG } from '../../../../infrastructure/config/api.config';
import { container } from '../../../../infrastructure/bootstrap/container';
import { TYPES as ROOT_TYPES } from '../../../../infrastructure/bootstrap/types';
import type { HttpClientPort } from '../../../../infrastructure/http/ports/http-client.port';

const httpClient = container.get<HttpClientPort>(ROOT_TYPES.HttpClient);

interface Props {
  projectId: string;
  researchData?: ResearchDataProp;
  isModalOpen?: boolean;
  responseCount?: number;
}

const props = defineProps<Props>();

// Canvas loaded lazily when the modal first opens
const loadedCanvas = ref<ResearchCanvas | null>(null);
const canvasLoading = ref(false);
const canvasLoaded = ref(false);

async function loadCanvas() {
  if (canvasLoaded.value || canvasLoading.value || !props.projectId) return;
  canvasLoading.value = true;
  try {
    const url = API_CONFIG.ENDPOINTS.RESEARCH_CANVAS(props.projectId);
    const data = await httpClient.get<{ canvas: ResearchCanvas }>(url);
    if (data?.canvas) loadedCanvas.value = data.canvas;
    canvasLoaded.value = true;
  } catch {
    canvasLoaded.value = true;
  } finally {
    canvasLoading.value = false;
  }
}

// Merge prop synthesisReport with lazily-loaded canvas
const mergedResearchData = computed(() => {
  const base = props.researchData as (ResearchData | null | undefined);
  if (loadedCanvas.value) {
    return { ...(base ?? {}), canvas: loadedCanvas.value };
  }
  return base;
});

const activeTab = ref('signals');
const internalModalOpen = ref(false);

const isModalOpen = computed({
  get: () => props.isModalOpen ?? internalModalOpen.value,
  set: (value) => {
    internalModalOpen.value = value;
    emit('update:is-modal-open', value);
  }
});

// Load canvas on first open
watch(() => props.isModalOpen, (newValue) => {
  if (newValue !== undefined) {
    internalModalOpen.value = newValue;
  }
  if (newValue) loadCanvas();
});

const tabs: TabItem[] = [
  { id: 'signals', label: 'Early Signals', icon: Zap },
  { id: 'competitors', label: 'Competitors', icon: Users },
  { id: 'search', label: 'Search Suggestions', icon: Search },
  { id: 'user-signals', label: 'User Signals', icon: MapPin },
  { id: 'synthesis', label: 'Synthesis', icon: FileText },
];

const emit = defineEmits<{
  'update:is-modal-open': [value: boolean];
}>();

const closeModal = () => {
  isModalOpen.value = false;
};
</script>

<style scoped>
.show-details-widget {
  position: relative;
}

.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(15, 23, 42, 0.6);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 1rem;
}

.modal-content {
  background: var(--color-bg);
  border: var(--border-width) var(--border-style) var(--color-border-light);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-xl);
  max-width: 90vw;
  max-height: 90vh;
  width: 1000px;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1.5rem;
  border-bottom: var(--border-width) var(--border-style) var(--color-border-light);
  background: var(--color-bg-subtle);
}

.modal-title-section {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.modal-icon {
  width: 1.5rem;
  height: 1.5rem;
  color: var(--color-accent);
  flex-shrink: 0;
}

.modal-title {
  font-size: var(--text-xl);
  font-weight: var(--font-weight-semibold);
  color: var(--color-text);
  margin: 0;
  letter-spacing: -0.01em;
}

.modal-close {
  background: none;
  border: none;
  color: var(--color-text-muted);
  cursor: pointer;
  padding: 0.5rem;
  border-radius: var(--radius-md);
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
}

.modal-close:hover {
  color: var(--color-text);
  background: var(--color-bg);
}

.modal-body {
  flex: 1;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.details-tabs {
  display: flex;
  gap: 0.25rem;
  padding: 0 1.5rem;
  background: var(--color-bg-subtle);
  border-bottom: var(--border-width) var(--border-style) var(--color-border-light);
}

.tab-button {
  background: none;
  border: none;
  padding: 0.75rem 1rem;
  color: var(--color-text-muted);
  cursor: pointer;
  border-radius: var(--radius-md) var(--radius-md) 0 0;
  border-bottom: var(--border-width) var(--border-style) transparent;
  transition: all 0.2s;
  font-size: var(--text-sm);
  font-weight: var(--font-weight-medium);
  display: flex;
  align-items: center;
  gap: 0.5rem;
  position: relative;
}

.tab-button:hover {
  color: var(--color-text);
  background: rgba(255, 255, 255, 0.5);
}

.tab-button.active {
  color: var(--color-accent);
  background: var(--color-bg);
  border-bottom-color: var(--color-accent);
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.tab-icon {
  width: 1rem;
  height: 1rem;
  flex-shrink: 0;
}

.tab-content {
  flex: 1;
  overflow-y: auto;
  padding: 1.5rem;
  background: var(--color-bg);
}

.tab-pane {
  min-height: 400px;
  animation: fadeIn 0.2s ease-in-out;
}

.canvas-loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 400px;
  gap: var(--space-3);
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(4px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@media (max-width: 768px) {
  .modal-overlay {
    padding: 0.5rem;
  }

  .modal-content {
    width: 100%;
    max-width: none;
    margin: 0;
    max-height: calc(100vh - 1rem);
  }

  .modal-header {
    padding: 1rem;
  }

  .modal-title {
    font-size: var(--text-lg);
  }

  .details-tabs {
    padding: 0 1rem;
    overflow-x: auto;
    -webkit-overflow-scrolling: touch;
  }

  .tab-button {
    white-space: nowrap;
    padding: 0.625rem 0.875rem;
    font-size: var(--text-xs);
  }

  .tab-content {
    padding: 1rem;
  }

  .tab-pane {
    min-height: 300px;
  }
}

@media (max-width: 480px) {
  .tab-button {
    padding: 0.5rem 0.75rem;
    gap: 0.25rem;
  }

  .tab-icon {
    width: 0.875rem;
    height: 0.875rem;
  }
}
</style>