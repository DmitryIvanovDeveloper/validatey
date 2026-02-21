<template>
  <div class="wizard-view">
    <h1>Create Project</h1>
    <p>Project creation wizard will be here</p>
    <div class="steps">
      <div class="step">1. Segment</div>
      <div class="step">2. Hypothesis</div>
      <div class="step">3. Scenario</div>
      <div class="step">4. Audience and Payment</div>
    </div>
  </div>
</template>

<script setup lang="ts">
// Create Project Wizard View - project creation wizard (4 steps)
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


