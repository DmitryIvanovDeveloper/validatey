<template>
  <div class="assumptions-widget">
    <div v-if="loading" class="widget-loading">...</div>
    <div v-else-if="error" class="widget-error">{{ error }}</div>
    <div v-else class="widget-content">
      <span class="widget-label">Assumptions</span>
      <span class="widget-value">{{ totalCount }}</span>

      <!-- Horizontal status bar (shown in card chip context via :deep) -->
      <div v-if="statusCounts && hasStatuses && totalCount > 0" class="widget-status-bar" :title="statusBarTitle">
        <div
          v-if="statusCounts.confirmed > 0"
          class="widget-status-bar__segment widget-status-bar__segment--confirmed"
          :style="{ flex: statusCounts.confirmed }"
        />
        <div
          v-if="statusCounts.need_more > 0"
          class="widget-status-bar__segment widget-status-bar__segment--need-more"
          :style="{ flex: statusCounts.need_more }"
        />
        <div
          v-if="statusCounts.not_supported > 0"
          class="widget-status-bar__segment widget-status-bar__segment--not-supported"
          :style="{ flex: statusCounts.not_supported }"
        />
        <div
          v-if="unassessedCount > 0"
          class="widget-status-bar__segment widget-status-bar__segment--unassessed"
          :style="{ flex: unassessedCount }"
        />
      </div>

      <!-- Status micro-badges (shown in card chip context via :deep) -->
      <div v-if="statusCounts && hasStatuses" class="widget-status-counts">
        <span v-if="statusCounts.confirmed > 0" class="widget-status-count widget-status-count--confirmed">
          {{ statusCounts.confirmed }}✓
        </span>
        <span v-if="statusCounts.need_more > 0" class="widget-status-count widget-status-count--need-more">
          {{ statusCounts.need_more }}?
        </span>
        <span v-if="statusCounts.not_supported > 0" class="widget-status-count widget-status-count--not-supported">
          {{ statusCounts.not_supported }}✗
        </span>
      </div>

      <!-- Donut chart (shown in full Research Canvas view) -->
      <div v-if="statusCounts && hasStatuses && chartSeries.length > 0" class="widget-chart-container">
        <apexchart
          type="donut"
          :options="chartOptions"
          :series="chartSeries"
          :height="56"
          :width="56"
          class="widget-donut"
        />
      </div>
      <div v-else-if="totalCount === 0" class="widget-empty">—</div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue';
import VueApexCharts from 'vue3-apexcharts';
import { container } from '../../../../infrastructure/bootstrap/container';
import { ResearchPresenter } from '../presenters/research.presenter';
import { TYPES as RESEARCH_TYPES } from '../../infrastructure/bootstrap/types';

// Register ApexCharts component
const apexchart = VueApexCharts;

interface Props {
  projectId: string;
}

const props = defineProps<Props>();

const loading = ref(false);
const error = ref<string | null>(null);
const assumptionStatuses = ref<('confirmed' | 'need_more' | 'not_supported')[] | null>(null);

const researchPresenter = container.get<ResearchPresenter>(RESEARCH_TYPES.ResearchPresenter);

const totalCount = computed(() => assumptionStatuses.value?.length ?? 0);

const unassessedCount = computed(() => {
  if (!statusCounts.value) return totalCount.value;
  return Math.max(0, totalCount.value - statusCounts.value.confirmed - statusCounts.value.need_more - statusCounts.value.not_supported);
});

const statusBarTitle = computed(() => {
  if (!statusCounts.value) return '';
  const parts: string[] = [];
  if (statusCounts.value.confirmed > 0) parts.push(`${statusCounts.value.confirmed} confirmed`);
  if (statusCounts.value.need_more > 0) parts.push(`${statusCounts.value.need_more} need more data`);
  if (statusCounts.value.not_supported > 0) parts.push(`${statusCounts.value.not_supported} not supported`);
  if (unassessedCount.value > 0) parts.push(`${unassessedCount.value} not assessed`);
  return parts.join(' · ');
});

const statusCounts = computed(() => {
  if (!assumptionStatuses.value || assumptionStatuses.value.length === 0) return null;
  
  const counts = {
    confirmed: assumptionStatuses.value.filter(s => s === 'confirmed').length,
    need_more: assumptionStatuses.value.filter(s => s === 'need_more').length,
    not_supported: assumptionStatuses.value.filter(s => s === 'not_supported').length,
  };
  
  // Детальная отладочная информация
  const uniqueStatuses = [...new Set(assumptionStatuses.value)];
  console.log('AssumptionsWidget statusCounts:', {
    total: assumptionStatuses.value.length,
    statuses: assumptionStatuses.value,
    uniqueStatuses: uniqueStatuses,
    uniqueCount: uniqueStatuses.length,
    counts,
    hasMultipleStatuses: uniqueStatuses.length > 1,
  });
  
  // Если есть несколько разных статусов, но counts показывает только один - это проблема
  if (uniqueStatuses.length > 1) {
    console.warn('⚠ Multiple unique statuses detected but counts might be wrong:', {
      uniqueStatuses,
      counts,
      statusArray: assumptionStatuses.value,
    });
  }
  
  return counts;
});

const hasStatuses = computed(() => {
  if (!statusCounts.value) return false;
  return statusCounts.value.confirmed > 0 || statusCounts.value.need_more > 0 || statusCounts.value.not_supported > 0;
});

// Формируем данные для ApexCharts
const chartSeries = computed(() => {
  if (!statusCounts.value || !hasStatuses.value) {
    return [];
  }

  const series: number[] = [];
  
  // Порядок важен: сначала confirmed, потом need_more, потом not_supported
  if (statusCounts.value.confirmed > 0) {
    series.push(statusCounts.value.confirmed);
  }
  if (statusCounts.value.need_more > 0) {
    series.push(statusCounts.value.need_more);
  }
  if (statusCounts.value.not_supported > 0) {
    series.push(statusCounts.value.not_supported);
  }

  console.log('AssumptionsWidget chartSeries:', {
    series,
    seriesLength: series.length,
    statusCounts: statusCounts.value,
    hasMultipleSegments: series.length > 1,
  });

  // Проверка: если есть несколько разных статусов, но series содержит только один элемент
  if (statusCounts.value) {
    const nonZeroCounts = Object.values(statusCounts.value).filter(c => c > 0).length;
    if (nonZeroCounts > 1 && series.length === 1) {
      console.error('❌ ERROR: Multiple status types detected but series has only one element!', {
        statusCounts: statusCounts.value,
        series,
        nonZeroCounts,
      });
    }
  }

  return series;
});

const chartLabels = computed(() => {
  if (!statusCounts.value || !hasStatuses.value) {
    return [];
  }

  const labels: string[] = [];
  
  if (statusCounts.value.confirmed > 0) {
    labels.push('Confirmed');
  }
  if (statusCounts.value.need_more > 0) {
    labels.push('NeedMore'); // Убираем пробел для ApexCharts
  }
  if (statusCounts.value.not_supported > 0) {
    labels.push('NotSupported'); // Убираем пробел для ApexCharts
  }

  console.log('AssumptionsWidget chartLabels:', {
    labels,
    labelsLength: labels.length,
  });

  return labels;
});

const chartColors = computed(() => {
  if (!statusCounts.value || !hasStatuses.value) {
    return [];
  }

  const colors: string[] = [];
  
  if (statusCounts.value.confirmed > 0) {
    colors.push('#059669'); // success color - зеленый
  }
  if (statusCounts.value.need_more > 0) {
    colors.push('#d97706'); // warning color - оранжевый
  }
  if (statusCounts.value.not_supported > 0) {
    colors.push('#dc2626'); // error color - красный
  }

  const mapping = chartLabels.value.map((label, idx) => ({
    label,
    value: chartSeries.value[idx],
    color: colors[idx],
  }));

  console.log('AssumptionsWidget chartColors:', {
    colors,
    colorsLength: colors.length,
    series: chartSeries.value,
    seriesLength: chartSeries.value.length,
    labels: chartLabels.value,
    labelsLength: chartLabels.value.length,
    mapping,
    allLengthsMatch: colors.length === chartSeries.value.length && colors.length === chartLabels.value.length,
  });

  // Проверка: все массивы должны иметь одинаковую длину
  if (colors.length !== chartSeries.value.length || colors.length !== chartLabels.value.length) {
    console.error('❌ ERROR: Arrays length mismatch!', {
      colorsLength: colors.length,
      seriesLength: chartSeries.value.length,
      labelsLength: chartLabels.value.length,
    });
  }

  return colors;
});

const chartOptions = computed(() => ({
  chart: {
    type: 'donut',
    width: 56,
    height: 56,
    sparkline: {
      enabled: true, // Компактный режим без легенды и подписей
    },
    animations: {
      enabled: false, // Отключаем анимацию для быстрого обновления
    },
  },
  labels: chartLabels.value,
  colors: chartColors.value, // Массив цветов для каждого сегмента
  plotOptions: {
    pie: {
      donut: {
        size: '70%', // Размер внутреннего отверстия
      },
    },
  },
  legend: {
    show: false,
  },
  tooltip: {
    enabled: true,
    y: {
      formatter: (value: number) => {
        const total = chartSeries.value.reduce((a, b) => a + b, 0);
        const percentage = total > 0 ? Math.round((value / total) * 100) : 0;
        return `${value} (${percentage}%)`;
      },
    },
  },
  dataLabels: {
    enabled: false, // Отключаем подписи на сегментах
  },
  stroke: {
    show: false,
  },
}));

const loadAssumptions = async () => {
  try {
    loading.value = true;
    error.value = null;
    const result = await researchPresenter.getResearchCanvas(props.projectId);
    if (result.error) {
      error.value = result.error;
      console.error('AssumptionsWidget: Error from presenter', result.error);
    } else {
      const statuses = result.assumptionStatuses ?? null;
      assumptionStatuses.value = statuses;
      
      // Отладочная информация
      console.log('AssumptionsWidget: Loaded data', {
        hasStatuses: !!statuses,
        statusesCount: statuses?.length ?? 0,
        hasAssessments: !!result.assumptionAssessments,
        assessmentsCount: result.assumptionAssessments?.length ?? 0,
        statuses: statuses,
        assessments: result.assumptionAssessments,
      });
      
      if (statuses) {
        console.log('AssumptionsWidget: Loaded assumptionStatuses', {
          count: statuses.length,
          statuses: statuses,
          uniqueStatuses: [...new Set(statuses)],
          statusCounts: {
            confirmed: statuses.filter(s => s === 'confirmed').length,
            need_more: statuses.filter(s => s === 'need_more').length,
            not_supported: statuses.filter(s => s === 'not_supported').length,
          },
        });
      } else {
        console.warn('AssumptionsWidget: No assumptionStatuses returned', {
          hasAssessments: !!result.assumptionAssessments,
          assessmentsCount: result.assumptionAssessments?.length ?? 0,
          fullResult: result,
        });
      }
    }
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Failed to load assumptions';
    console.error('AssumptionsWidget: Error loading assumptions', err);
  } finally {
    loading.value = false;
  }
};

onMounted(() => {
  loadAssumptions();
});

// Watch for changes in assumptionStatuses to debug
watch(assumptionStatuses, (newStatuses) => {
  if (newStatuses) {
    console.log('AssumptionsWidget: assumptionStatuses changed', {
      count: newStatuses.length,
      statuses: newStatuses,
      unique: [...new Set(newStatuses)],
    });
  }
}, { deep: true });
</script>

<style scoped>
.assumptions-widget {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.8125rem;
}

.widget-loading,
.widget-error {
  color: var(--color-text-muted);
  font-size: 0.75rem;
}

.widget-content {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  position: relative;
}

.widget-chart-container {
  width: 56px;
  height: 56px;
  flex-shrink: 0;
}

.widget-donut {
  width: 100% !important;
  height: 100% !important;
}

.widget-empty {
  color: var(--color-text-muted);
  font-size: 0.75rem;
}

.widget-label {
  color: var(--color-text-muted);
}

.widget-value {
  font-weight: 600;
  color: var(--color-text);
}

.widget-badges {
  display: flex;
  gap: 0.25rem;
}

.badge {
  padding: 0.125rem 0.375rem;
  border-radius: 0.25rem;
  font-size: 0.75rem;
  font-weight: 500;
}

.badge-confirmed {
  background: var(--color-success-bg, #d1fae5);
  color: var(--color-success, #059669);
}

.badge-need-more {
  background: var(--color-warning-bg, #fef3c7);
  color: var(--color-warning, #d97706);
}

.badge-not-supported {
  background: var(--color-error-bg, #fee2e2);
  color: var(--color-error, #dc2626);
}

/* ─── Horizontal status bar ───────────────────────────────────── */
.widget-status-bar {
  display: none; /* hidden by default; shown via :deep in ProjectCard chip */
  height: 4px;
  border-radius: 9999px;
  overflow: hidden;
  gap: 1px;
  background: var(--color-bg-subtle);
}

.widget-status-bar__segment {
  display: flex;
  height: 100%;
  min-width: 4px;
  border-radius: 9999px;
  transition: flex 0.3s ease;
}

.widget-status-bar__segment--confirmed  { background: var(--color-success, #059669); }
.widget-status-bar__segment--need-more  { background: var(--color-warning, #d97706); }
.widget-status-bar__segment--not-supported { background: var(--color-error, #dc2626); }
.widget-status-bar__segment--unassessed { background: var(--color-border, #cbd5e1); }

/* ─── Status micro-counts ─────────────────────────────────────── */
.widget-status-counts {
  display: none; /* hidden by default; shown via :deep in ProjectCard chip */
  gap: 0.3125rem;
  align-items: center;
}

.widget-status-count {
  font-size: 0.625rem;
  font-weight: 700;
  line-height: 1;
  white-space: nowrap;
}

.widget-status-count--confirmed    { color: var(--color-success, #059669); }
.widget-status-count--need-more    { color: var(--color-warning, #d97706); }
.widget-status-count--not-supported { color: var(--color-error, #dc2626); }
</style>
