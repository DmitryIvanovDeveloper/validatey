<template>
  <div class="comments-activity-widget">
    <div class="section-card signals-card">
      <div class="section-card-header">
        <h3 class="section-title">Comments over time</h3>
      </div>

      <div v-if="loading" class="loading-state">
        <p class="loading-text">Loading...</p>
      </div>

      <div v-else-if="error" class="state state-error">
        <p class="state-desc">{{ error }}</p>
      </div>

      <div v-else-if="buckets.length === 0" class="empty-state">
        <p class="empty-text">No comment data yet</p>
      </div>

      <div v-else class="activity-content">
        <div class="activity-donut-wrap">
          <apexchart
            type="donut"
            :options="chartOptions"
            :series="chartSeries"
            :height="220"
            class="activity-donut"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue';
import VueApexCharts from 'vue3-apexcharts';
import { container } from '../../../../infrastructure/bootstrap/container';
import { CommentsPresenter } from '../presenters/comments.presenter';
import { COMMENT_TYPES } from '../../types';

const apexchart = VueApexCharts;

/** Professional multicolor palette for time buckets (teal → blue → sandy/beige). */
const DONUT_PALETTE = [
  '#0d9488', '#0f766e', '#115e59', '#134e4a',
  '#0369a1', '#0284c7', '#0ea5e9', '#38bdf8',
  '#b8860b', '#c9a227', '#d4a574', '#deb887',
];

interface Props {
  projectId: string;
}

const props = defineProps<Props>();

const loading = ref(false);
const error = ref<string | null>(null);
const buckets = ref<{ bucket: string; count: number }[]>([]);

const commentsPresenter = container.get<CommentsPresenter>(COMMENT_TYPES.CommentsPresenter);

const chartSeries = computed(() => buckets.value.map((b) => b.count));
const chartLabels = computed(() => buckets.value.map((b) => b.bucket));
const chartColors = computed(() =>
  buckets.value.map((_, i) => DONUT_PALETTE[i % DONUT_PALETTE.length])
);

const chartOptions = computed(() => ({
  chart: {
    type: 'donut',
    fontFamily: 'inherit',
    animations: { enabled: true },
  },
  labels: chartLabels.value,
  colors: chartColors.value,
  plotOptions: {
    pie: {
      donut: {
        size: '58%',
        labels: {
          show: true,
          total: {
            show: true,
            label: 'Total',
            formatter: () => String(chartSeries.value.reduce((a, b) => a + b, 0)),
          },
        },
      },
    },
  },
  legend: {
    show: true,
    position: 'right',
    fontSize: '12px',
    labels: { colors: 'var(--color-text, #374151)' },
    itemMargin: { horizontal: 6, vertical: 4 },
  },
  tooltip: {
    y: {
      formatter: (value: number) => {
        const total = chartSeries.value.reduce((a, b) => a + b, 0);
        const pct = total > 0 ? Math.round((value / total) * 100) : 0;
        return `${value} comments (${pct}%)`;
      },
    },
  },
  dataLabels: { enabled: false },
  stroke: { width: 1, colors: 'var(--color-bg-page, #fff)' },
}));

async function load() {
  if (!props.projectId) return;
  loading.value = true;
  error.value = null;
  try {
    const result = await commentsPresenter.getCommentsActivity(props.projectId);
    if (result.error) {
      error.value = result.error;
      buckets.value = [];
    } else if (result.data) {
      buckets.value = result.data.buckets;
    } else {
      buckets.value = [];
    }
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Failed to load activity';
    buckets.value = [];
  } finally {
    loading.value = false;
  }
}

onMounted(() => load());
watch(() => props.projectId, (id) => {
  buckets.value = [];
  if (id) load();
});

defineExpose({
  reload: load
});
</script>

<style scoped>
.comments-activity-widget {
  margin-bottom: 0;
}

.section-card {
  background: var(--color-bg-page);
  border-radius: 0.75rem;
  border: var(--border-width) var(--border-style) var(--color-border);
  padding: 1.5rem;
}

.section-card-header {
  margin-bottom: 1rem;
  padding: 0;
}

.section-title {
  font-size: 0.9375rem;
  font-weight: 600;
  color: var(--color-text);
  margin: 0;
}

.loading-state,
.state,
.empty-state {
  padding: 1rem 0;
  text-align: center;
  color: var(--color-text-muted);
  font-size: 0.8125rem;
}

.state-error {
  color: var(--color-error);
}

.activity-content {
  padding: 0.25rem 0;
}

.activity-donut-wrap {
  display: flex;
  justify-content: center;
  min-height: 220px;
}

.activity-donut {
  max-width: 100%;
}
</style>
