<template>
  <div class="audio-recorder">
    <button v-if="!isRecording" @click="startRecording" class="record-button">
      Start Recording
    </button>
    <div v-else class="recording-controls">
      <span class="recording-indicator">● Recording...</span>
      <span class="duration">{{ formatDuration(duration) }}</span>
      <button @click="stopRecording" class="stop-button">Stop</button>
    </div>
    <audio v-if="audioUrl" :src="audioUrl" controls></audio>
  </div>
</template>

<script setup lang="ts">
import { ref, onUnmounted } from 'vue';

const isRecording = ref(false);
const duration = ref(0);
const audioUrl = ref<string | null>(null);
let mediaRecorder: MediaRecorder | null = null;
let audioChunks: Blob[] = [];
let durationInterval: number | null = null;
let startTime: number = 0;

const startRecording = async () => {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    mediaRecorder = new MediaRecorder(stream);
    audioChunks = [];

    mediaRecorder.ondataavailable = (event) => {
      audioChunks.push(event.data);
    };

    mediaRecorder.onstop = () => {
      const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
      audioUrl.value = URL.createObjectURL(audioBlob);
      emit('recorded', audioBlob);
      stream.getTracks().forEach(track => track.stop());
    };

    mediaRecorder.start();
    isRecording.value = true;
    startTime = Date.now();
    durationInterval = window.setInterval(() => {
      duration.value = Math.floor((Date.now() - startTime) / 1000);
    }, 1000);
  } catch (error) {
    console.error('Failed to start recording:', error);
  }
};

const stopRecording = () => {
  if (mediaRecorder && isRecording.value) {
    mediaRecorder.stop();
    isRecording.value = false;
    if (durationInterval) {
      clearInterval(durationInterval);
      durationInterval = null;
    }
  }
};

const formatDuration = (seconds: number): string => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

const emit = defineEmits<{
  recorded: [blob: Blob];
}>();

onUnmounted(() => {
  if (durationInterval) {
    clearInterval(durationInterval);
  }
  if (mediaRecorder && isRecording.value) {
    mediaRecorder.stop();
  }
});
</script>

<style scoped>
.audio-recorder {
  margin: 1rem 0;
}

.record-button,
.stop-button {
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 0.5rem;
  font-weight: 500;
  cursor: pointer;
  transition: background 0.2s;
}

.record-button {
  background: #34C759;
  color: white;
}

.record-button:hover {
  background: #28a745;
}

.stop-button {
  background: #FF3B30;
  color: white;
}

.stop-button:hover {
  background: #dc3545;
}

.recording-controls {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem;
  background: #fff3cd;
  border-radius: 0.5rem;
}

.recording-indicator {
  color: #FF3B30;
  font-weight: 500;
  animation: pulse 1s infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}

.duration {
  font-weight: 500;
}
</style>

