<template>
  <div class="projects-view">
    <div class="header">
      <h1>Projects</h1>
      <router-link to="/projects/new" class="create-btn">
        + New Project
      </router-link>
    </div>
    <div class="projects-list">
      <p class="empty-state">Projects will be displayed here</p>
    </div>
  </div>
</template>

<script setup lang="ts">
// Projects View - projects list
</script>

<style scoped>
.projects-view {
  padding: 2rem 0;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
}

.header h1 {
  font-size: 2rem;
  color: #1a202c;
}

.create-btn {
  padding: 0.5rem 1.5rem;
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

.projects-list {
  min-height: 400px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.empty-state {
  color: #718096;
  font-size: 1.125rem;
}
</style>


