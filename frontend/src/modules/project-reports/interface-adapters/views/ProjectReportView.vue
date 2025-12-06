<template>
  <div class="project-report-view">
    <div class="report-header">
      <div>
        <router-link :to="`/projects/${projectId}`" class="back-link">← Назад к проекту</router-link>
        <h1>Отчёт по проекту</h1>
      </div>
      <div class="header-actions">
        <button @click="downloadReport('html')" class="btn btn-secondary">
          📄 Скачать HTML
        </button>
        <button @click="downloadReport('pdf')" class="btn btn-secondary">
          📑 Скачать PDF
        </button>
        <button @click="shareReport" class="btn btn-primary">
          🔗 Поделиться
        </button>
      </div>
    </div>

    <div v-if="loading" class="loading-state">
      <LoadingSpinner />
      <p>Генерация отчёта...</p>
    </div>

    <div v-else-if="error" class="error-state">
      <ErrorDisplay :message="error" />
      <button @click="generateReport" class="btn btn-primary">Сгенерировать отчёт</button>
    </div>

    <div v-else-if="report" class="report-content">
      <!-- Вердикт -->
      <Card class="verdict-card" :class="`verdict-${report.verdictType}`">
        <template #header>
          <h2 class="verdict-title">Вердикт</h2>
        </template>
        <div class="verdict-content">
          <div class="verdict-icon">{{ getVerdictIcon(report.verdictType) }}</div>
          <p class="verdict-text">{{ report.verdict }}</p>
        </div>
      </Card>

      <!-- Метрики -->
      <Card title="Ключевые метрики" class="metrics-card">
        <div class="metrics-grid">
          <div v-for="(value, key) in report.metrics" :key="key" class="metric-item">
            <div class="metric-label">{{ formatMetricLabel(key) }}</div>
            <div class="metric-value">{{ formatMetricValue(value) }}</div>
          </div>
        </div>
      </Card>

      <!-- WTP (Willingness to Pay) -->
      <Card title="Готовность платить (WTP)" class="wtp-card">
        <div class="wtp-content">
          <div class="wtp-value">{{ report.wtp.toFixed(2) }} ₽</div>
          <p class="wtp-description">Средняя готовность целевой аудитории платить за решение</p>
        </div>
      </Card>

      <!-- Кластеры -->
      <Card title="Кластеры респондентов" class="clusters-card">
        <div class="clusters-list">
          <div
            v-for="(cluster, index) in Object.entries(report.clusters)"
            :key="index"
            class="cluster-item"
          >
            <div class="cluster-header">
              <h3 class="cluster-name">Кластер {{ index + 1 }}: {{ cluster[0] }}</h3>
              <span class="cluster-size">{{ cluster[1].size }} респондентов</span>
            </div>
            <div class="cluster-details">
              <div v-for="(value, key) in cluster[1]" :key="key" v-if="key !== 'size'" class="cluster-stat">
                <span class="stat-label">{{ key }}:</span>
                <span class="stat-value">{{ value }}</span>
              </div>
            </div>
          </div>
        </div>
      </Card>

      <!-- Альтернативы -->
      <Card title="Альтернативные решения" class="alternatives-card">
        <ul class="alternatives-list">
          <li v-for="(alt, index) in report.alternatives" :key="index" class="alternative-item">
            {{ alt }}
          </li>
        </ul>
      </Card>

      <!-- Рекомендации -->
      <Card title="Рекомендации" class="recommendations-card">
        <ol class="recommendations-list">
          <li v-for="(rec, index) in report.recommendations" :key="index" class="recommendation-item">
            {{ rec }}
          </li>
        </ol>
      </Card>

      <!-- Actions -->
      <div class="report-actions">
        <button @click="createNewHypothesis" class="btn btn-primary btn-large">
          ✨ Создать новый раунд/гипотезу
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import Card from '@/shared/components/Card.vue';
import LoadingSpinner from '@/shared/components/LoadingSpinner.vue';
import ErrorDisplay from '@/shared/components/ErrorDisplay.vue';

const route = useRoute();
const router = useRouter();
const projectId = route.params.projectId as string;

const loading = ref(true);
const error = ref<string | null>(null);
const report = ref<{
  verdict: string;
  verdictType: 'positive' | 'negative' | 'neutral';
  metrics: Record<string, any>;
  clusters: Record<string, any>;
  alternatives: string[];
  wtp: number;
  recommendations: string[];
} | null>(null);

const getVerdictIcon = (type: string): string => {
  const icons: Record<string, string> = {
    positive: '✅',
    negative: '❌',
    neutral: '⚠️',
  };
  return icons[type] || 'ℹ️';
};

const formatMetricLabel = (key: string): string => {
  return key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
};

const formatMetricValue = (value: any): string => {
  if (typeof value === 'number') {
    return value.toFixed(2);
  }
  return String(value);
};

const generateReport = async () => {
  loading.value = true;
  error.value = null;
  
  // TODO: Вызов presenter для генерации отчёта
  setTimeout(() => {
    loading.value = false;
    // Заглушка данных
    report.value = {
      verdict: 'Гипотеза подтверждена с положительными сигналами',
      verdictType: 'positive',
      metrics: {
        response_rate: 0.75,
        satisfaction_score: 4.2,
        nps: 8.5,
      },
      clusters: {
        'Энтузиасты': { size: 45, avg_score: 4.8 },
        'Нейтральные': { size: 30, avg_score: 3.2 },
        'Скептики': { size: 25, avg_score: 2.1 },
      },
      alternatives: [
        'Использовать существующее решение X',
        'Разработать упрощённую версию',
      ],
      wtp: 150.50,
      recommendations: [
        'Фокусироваться на кластере энтузиастов',
        'Улучшить onboarding для скептиков',
        'Рассмотреть ценовую стратегию на основе WTP',
      ],
    };
  }, 2000);
};

const downloadReport = async (format: 'html' | 'pdf') => {
  // TODO: Реализация скачивания отчёта
  console.log(`Downloading report as ${format}`);
};

const shareReport = () => {
  // TODO: Реализация шаринга отчёта
  if (navigator.share) {
    navigator.share({
      title: 'Отчёт по проекту',
      text: 'Посмотрите результаты валидации гипотезы',
      url: window.location.href,
    });
  } else {
    navigator.clipboard.writeText(window.location.href);
    alert('Ссылка скопирована в буфер обмена');
  }
};

const createNewHypothesis = () => {
  router.push(`/projects/new`);
};

onMounted(() => {
  generateReport();
});
</script>

<style scoped>
.project-report-view {
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem 1rem;
}

.report-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 2rem;
  gap: 1rem;
}

.report-header h1 {
  font-size: 2rem;
  font-weight: 700;
  color: #1a202c;
  margin: 0.5rem 0 0 0;
}

.back-link {
  color: #4299e1;
  text-decoration: none;
  font-weight: 500;
  display: inline-block;
  margin-bottom: 0.5rem;
}

.header-actions {
  display: flex;
  gap: 0.75rem;
  flex-wrap: wrap;
}

.loading-state,
.error-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 4rem 2rem;
  text-align: center;
}

.report-content {
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

.verdict-card {
  border-left: 4px solid #e2e8f0;
}

.verdict-positive {
  border-left-color: #48bb78;
  background: linear-gradient(to right, #f0fff4, white);
}

.verdict-negative {
  border-left-color: #f56565;
  background: linear-gradient(to right, #fff5f5, white);
}

.verdict-neutral {
  border-left-color: #ed8936;
  background: linear-gradient(to right, #fffaf0, white);
}

.verdict-content {
  display: flex;
  align-items: flex-start;
  gap: 1.5rem;
}

.verdict-icon {
  font-size: 3rem;
  flex-shrink: 0;
}

.verdict-text {
  font-size: 1.25rem;
  line-height: 1.6;
  color: #2d3748;
  margin: 0;
  flex: 1;
}

.metrics-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1.5rem;
}

.metric-item {
  padding: 1rem;
  background: #f7fafc;
  border-radius: 0.5rem;
}

.metric-label {
  font-size: 0.875rem;
  color: #718096;
  margin-bottom: 0.5rem;
}

.metric-value {
  font-size: 1.5rem;
  font-weight: 700;
  color: #1a202c;
}

.wtp-content {
  text-align: center;
  padding: 2rem;
}

.wtp-value {
  font-size: 3rem;
  font-weight: 700;
  color: #4299e1;
  margin-bottom: 0.5rem;
}

.wtp-description {
  color: #718096;
  font-size: 1rem;
  margin: 0;
}

.clusters-list {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.cluster-item {
  padding: 1.5rem;
  background: #f7fafc;
  border-radius: 0.5rem;
  border-left: 4px solid #4299e1;
}

.cluster-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.cluster-name {
  font-size: 1.125rem;
  font-weight: 600;
  color: #1a202c;
  margin: 0;
}

.cluster-size {
  font-size: 0.875rem;
  color: #718096;
  background: white;
  padding: 0.25rem 0.75rem;
  border-radius: 9999px;
}

.cluster-details {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 1rem;
}

.cluster-stat {
  display: flex;
  flex-direction: column;
}

.stat-label {
  font-size: 0.875rem;
  color: #718096;
}

.stat-value {
  font-size: 1rem;
  font-weight: 600;
  color: #2d3748;
}

.alternatives-list,
.recommendations-list {
  list-style: none;
  padding: 0;
  margin: 0;
}

.alternative-item,
.recommendation-item {
  padding: 1rem;
  margin-bottom: 0.75rem;
  background: #f7fafc;
  border-radius: 0.5rem;
  border-left: 4px solid #ed8936;
}

.recommendation-item {
  counter-increment: recommendation;
  position: relative;
  padding-left: 3rem;
}

.recommendations-list {
  counter-reset: recommendation;
}

.recommendation-item::before {
  content: counter(recommendation);
  position: absolute;
  left: 1rem;
  top: 1rem;
  width: 24px;
  height: 24px;
  background: #4299e1;
  color: white;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  font-size: 0.875rem;
}

.report-actions {
  margin-top: 2rem;
  text-align: center;
}

.btn {
  padding: 0.75rem 1.5rem;
  border-radius: 0.5rem;
  font-weight: 500;
  cursor: pointer;
  border: none;
  transition: all 0.2s;
}

.btn-primary {
  background: #4299e1;
  color: white;
}

.btn-primary:hover {
  background: #3182ce;
}

.btn-secondary {
  background: #e2e8f0;
  color: #4a5568;
}

.btn-secondary:hover {
  background: #cbd5e0;
}

.btn-large {
  padding: 1rem 2rem;
  font-size: 1.125rem;
}

@media (max-width: 768px) {
  .report-header {
    flex-direction: column;
  }

  .header-actions {
    width: 100%;
  }

  .header-actions .btn {
    flex: 1;
  }
}
</style>
