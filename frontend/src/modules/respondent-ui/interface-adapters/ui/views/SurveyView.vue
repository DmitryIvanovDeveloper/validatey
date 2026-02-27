<template>
  <div class="survey-view">
    <div class="survey-container">
      <h1>Survey</h1>
      <p>Token: {{ $route.params.token }}</p>
      <ProgressBar :percentage="0" size="sm" />
      <div class="survey-form">
        <p>Survey form will be here:</p>
        <ul>
          <li>1-5 scales</li>
          <li>Open questions</li>
          <li>Optional audio</li>
        </ul>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
// Survey View - survey form for respondent (stub)
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

.survey-form {
  margin-top: 2rem;
}

.survey-form ul {
  margin-top: 1rem;
  padding-left: 2rem;
  color: #4a5568;
}
</style>
