<template>
  <div class="scenario-editor-view">
    <h1>Scenario Editor</h1>
    <div v-if="viewModel.loading">Loading...</div>
    <div v-else-if="viewModel.error" class="error">{{ viewModel.error }}</div>
    <div v-else-if="viewModel.scenario">
      <textarea v-model="scenarioContent" rows="20" cols="80"></textarea>
      <button @click="saveScenario">Save</button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { ScenarioViewModel } from '../view-models/scenario.view-model';

const viewModel = new ScenarioViewModel();
const scenarioContent = ref('');
</script>

<style scoped>
.scenario-editor-view {
  padding: 2rem;
}

.error {
  color: red;
  padding: 1rem;
}
</style>

