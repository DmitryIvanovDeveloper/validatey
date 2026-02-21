<template>
  <div class="report-view">
    <h1>Project Report</h1>
    <p>Project ID: {{ $route.params.projectId }}</p>
    <div class="report-content">
      <p>Report will be displayed here:</p>
      <ul>
        <li>Verdict</li>
        <li>Metrics</li>
        <li>Clusters</li>
        <li>Alternatives</li>
        <li>WTP (Willingness To Pay)</li>
        <li>Recommendations</li>
      </ul>
      <button class="export-btn">Download PDF</button>
      <button class="export-btn">Download HTML</button>
    </div>
  </div>
</template>

<script setup lang="ts">
// Project Report View - project report
</script>

<style scoped>
.report-view {
  padding: 2rem 0;
}

.report-view h1 {
  font-size: 2rem;
  margin-bottom: 1rem;
  color: #1a202c;
}

.report-content {
  margin-top: 2rem;
  padding: 2rem;
  background: white;
  border-radius: 0.5rem;
}

.report-content ul {
  margin: 1rem 0;
  padding-left: 2rem;
  color: #4a5568;
}

.export-btn {
  margin-top: 1rem;
  margin-right: 0.5rem;
  padding: 0.5rem 1.5rem;
  background: #4299e1;
  color: white;
  border: none;
  border-radius: 0.5rem;
  font-weight: 500;
  cursor: pointer;
  transition: background 0.2s;
}

.export-btn:hover {
  background: #2b6cb0;
}
</style>


