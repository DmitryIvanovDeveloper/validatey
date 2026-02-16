<template>
  <div class="session-test">
    <h2>Session Status</h2>

    <div class="session-info">
      <div class="status-item">
        <strong>Is Authenticated:</strong> {{ sessionManager.isAuthenticated ? '✅ YES' : '❌ NO' }}
      </div>
      <div class="status-item">
        <strong>Session Ready:</strong> {{ sessionManager.isSessionReady ? '✅ YES' : '⏳ NO' }}
      </div>
      <div class="status-item">
        <strong>User ID:</strong> {{ sessionManager.currentUserId || 'null' }}
      </div>
      <div class="status-item">
        <strong>User Email:</strong> {{ sessionManager.currentUser?.email || 'null' }}
      </div>
      <div class="status-item">
        <strong>User Role:</strong> {{ sessionManager.currentSession?.role || 'null' }}
      </div>
    </div>

    <div class="local-storage">
      <h3>LocalStorage Data:</h3>
      <pre>{{ getLocalStorageData() }}</pre>
    </div>

    <div class="actions">
      <button @click="clearSession">Clear Session</button>
      <router-link to="/login" class="btn">Go to Login</router-link>
      <router-link to="/workspaces" class="btn">Go to Workspaces</router-link>
    </div>
  </div>
</template>

<script setup lang="ts">
import { sessionManager } from '../shared/services/session-manager';

function getLocalStorageData() {
  try {
    const data = localStorage.getItem('validatey_user_id');
    return data ? JSON.parse(data) : 'No data in localStorage';
  } catch (error) {
    return 'Error parsing localStorage data';
  }
}

function clearSession() {
  sessionManager.clearSession();
  // Refresh page to see changes
  window.location.reload();
}
</script>

<style scoped>
.session-test {
  padding: 20px;
  max-width: 600px;
  margin: 0 auto;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}

.session-info {
  background: #f8f9fa;
  padding: 20px;
  border-radius: 8px;
  margin-bottom: 20px;
  border: 1px solid #e9ecef;
}

.status-item {
  margin-bottom: 10px;
  padding: 8px 12px;
  background: white;
  border-radius: 4px;
  border-left: 4px solid #007bff;
}

.status-item strong {
  color: #495057;
}

.local-storage {
  background: #f8f9fa;
  padding: 20px;
  border-radius: 8px;
  margin-bottom: 20px;
  border: 1px solid #e9ecef;
}

.local-storage h3 {
  margin-top: 0;
  color: #495057;
}

pre {
  background: #fff;
  padding: 12px;
  border-radius: 4px;
  border: 1px solid #dee2e6;
  font-size: 12px;
  overflow-x: auto;
  margin: 10px 0 0 0;
}

.actions {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}

.btn {
  display: inline-block;
  padding: 8px 16px;
  border: 1px solid #007bff;
  border-radius: 4px;
  background: #007bff;
  color: white;
  text-decoration: none;
  cursor: pointer;
  font-size: 14px;
}

.btn:hover {
  background: #0056b3;
  border-color: #0056b3;
}

.btn:last-child {
  background: #28a745;
  border-color: #28a745;
}

.btn:last-child:hover {
  background: #1e7e34;
  border-color: #1e7e34;
}
</style>