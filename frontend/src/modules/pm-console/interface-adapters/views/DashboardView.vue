<template>
  <div class="dashboard-view">
    <h1>Дашборд</h1>
    <p>Добро пожаловать в Validatey!</p>
    <router-link to="/projects/new" class="create-btn">
      Создать новый проект
    </router-link>
  </div>
</template>

<script setup lang="ts">
// Dashboard View - главная страница PM консоли
</script>

<style scoped>
.dashboard-view {
  text-align: center;
  padding: 4rem 2rem;
}

.dashboard-view h1 {
  font-size: 2.5rem;
  margin-bottom: 1rem;
  color: #1a202c;
}

.dashboard-view p {
  font-size: 1.125rem;
  color: #718096;
  margin-bottom: 2rem;
}

.create-btn {
  display: inline-block;
  padding: 0.75rem 2rem;
  background: #4299e1;
  color: white;
  text-decoration: none;
  border-radius: 0.5rem;
  font-weight: 500;
  transition: background 0.2s;
}

.create-btn:hover {
  background: #2b6cb0;
}
</style>

