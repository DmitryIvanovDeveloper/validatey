<template>
  <div class="wizard-view">
    <h1>Создание проекта</h1>
    <p>Мастер создания проекта будет здесь</p>
    <div class="steps">
      <div class="step">1. Сегмент</div>
      <div class="step">2. Гипотеза</div>
      <div class="step">3. Сценарий</div>
      <div class="step">4. Аудитория и оплата</div>
    </div>
  </div>
</template>

<script setup lang="ts">
// Create Project Wizard View - мастер создания проекта (4 шага)
</script>

<style scoped>
.wizard-view {
  padding: 2rem 0;
}

.wizard-view h1 {
  font-size: 2rem;
  margin-bottom: 1rem;
  color: #1a202c;
}

.wizard-view p {
  color: #718096;
  margin-bottom: 2rem;
}

.steps {
  display: flex;
  gap: 1rem;
  margin-top: 2rem;
}

.step {
  flex: 1;
  padding: 1.5rem;
  background: white;
  border: 2px solid #e2e8f0;
  border-radius: 0.5rem;
  text-align: center;
  color: #718096;
}
</style>
