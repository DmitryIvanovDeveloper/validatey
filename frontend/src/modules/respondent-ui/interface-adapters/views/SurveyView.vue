<template>
  <div class="survey-view">
    <div class="survey-container">
      <h1>Опрос</h1>
      <p>Token: {{ $route.params.token }}</p>
      <div class="progress-bar">
        <div class="progress-fill" :style="{ width: '0%' }"></div>
      </div>
      <div class="survey-form">
        <p>Форма опроса будет здесь:</p>
        <ul>
          <li>Шкалы 1-5</li>
          <li>Открытые вопросы</li>
          <li>Опционально аудио</li>
        </ul>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
// Survey View - форма опроса для респондента
</script>

<style scoped>
.survey-view {
  min-height: 100vh;
  background: #f7fafc;
  padding: 2rem;
  display: flex;
  align-items: center;
  justify-content: center;
}

.survey-container {
  max-width: 800px;
  width: 100%;
  background: white;
  border-radius: 0.5rem;
  padding: 2rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.survey-container h1 {
  font-size: 2rem;
  margin-bottom: 1rem;
  color: #1a202c;
}

.progress-bar {
  width: 100%;
  height: 8px;
  background: #e2e8f0;
  border-radius: 4px;
  margin: 1.5rem 0;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: #4299e1;
  transition: width 0.3s;
}

.survey-form {
  margin-top: 2rem;
}

.survey-form ul {
  margin-top: 1rem;
  padding-left: 2rem;
  color: #4a5568;
}
</style>
