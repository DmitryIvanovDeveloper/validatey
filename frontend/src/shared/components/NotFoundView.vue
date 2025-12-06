<template>
  <div class="not-found">
    <h1>404</h1>
    <p>Страница не найдена</p>
    <router-link to="/" class="back-link">Вернуться на главную</router-link>
  </div>
</template>

<script setup lang="ts">
// Страница 404
</script>

<style scoped>
.not-found {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 60vh;
  text-align: center;
}

.not-found h1 {
  font-size: 4rem;
  font-weight: 700;
  color: #1a202c;
  margin-bottom: 1rem;
}

.not-found p {
  font-size: 1.25rem;
  color: #718096;
  margin-bottom: 2rem;
}

.back-link {
  color: #4299e1;
  text-decoration: none;
  font-weight: 500;
  transition: color 0.2s;
}

.back-link:hover {
  color: #2b6cb0;
}
</style>
