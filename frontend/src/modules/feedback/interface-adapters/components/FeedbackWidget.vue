<template>
  <div class="feedback-widget">
    <button
      type="button"
      class="feedback-widget__trigger"
      aria-label="Share feedback"
      :aria-expanded="open"
      @click="open = !open"
    >
      <span class="feedback-widget__icon" aria-hidden="true">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      </span>
      <span class="feedback-widget__label">Share feedback</span>
    </button>

    <Transition name="feedback-panel">
      <div v-if="open" class="feedback-widget__panel" role="dialog" aria-label="Feedback form">
        <div class="feedback-widget__panel-inner">
          <div v-if="successId" class="feedback-widget__success">
            <div class="feedback-widget__success-icon" aria-hidden="true">
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2"/>
                <path d="M8 12l3 3 5-6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
            </div>
            <p class="feedback-widget__success-text">Thanks for your feedback! We received your suggestion <strong>#{{ idShort(successId) }}</strong>. We'll review it and, if it gets enough votes, we'll add it to our roadmap.</p>
            <button type="button" class="feedback-widget__btn feedback-widget__btn--primary" @click="closeSuccess">Close</button>
          </div>
          <template v-else>
            <div class="feedback-widget__header">
              <h3 class="feedback-widget__title">Feedback</h3>
              <button type="button" class="feedback-widget__close" aria-label="Close" @click="open = false">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 6L6 18M6 6l12 12"/></svg>
              </button>
            </div>
            <form class="feedback-widget__form" @submit.prevent="submit">
              <div class="feedback-widget__types">
                <span class="feedback-widget__types-label">Type</span>
                <div class="feedback-widget__pills">
                  <label v-for="opt in typeOptions" :key="opt.value" class="feedback-widget__pill">
                    <input v-model="form.type" type="radio" :value="opt.value" class="feedback-widget__pill-input" />
                    <span class="feedback-widget__pill-label">{{ opt.label }}</span>
                  </label>
                </div>
              </div>
              <div class="feedback-widget__field">
                <label for="feedback-text" class="feedback-widget__label-text">Describe in detail</label>
                <textarea
                  id="feedback-text"
                  v-model="form.text"
                  class="feedback-widget__textarea"
                  rows="4"
                  required
                  placeholder="Tell us what to improve or what went wrong…"
                />
              </div>
              <div class="feedback-widget__field">
                <label class="feedback-widget__label-text">Screenshot (optional)</label>
                <label class="feedback-widget__upload">
                  <input
                    type="file"
                    accept="image/*"
                    class="feedback-widget__upload-input"
                    @change="onFileSelect"
                  />
                  <span class="feedback-widget__upload-text">{{ form.screenshotUrl ? 'File attached' : 'Choose file' }}</span>
                </label>
              </div>
              <p v-if="error" class="feedback-widget__error" role="alert">{{ error }}</p>
              <div class="feedback-widget__actions">
                <button type="button" class="feedback-widget__btn" @click="open = false">Cancel</button>
                <button type="submit" class="feedback-widget__btn feedback-widget__btn--primary" :disabled="sending">
                  <span v-if="sending" class="feedback-widget__spinner" aria-hidden="true"></span>
                  {{ sending ? 'Sending…' : 'Submit' }}
                </button>
              </div>
            </form>
          </template>
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue';
import { API_CONFIG } from '@/infrastructure/config/api.config';

const typeOptions = [
  { value: 'feature_request', label: 'New feature' },
  { value: 'bug_report', label: 'Bug report' },
  { value: 'what_is_missing', label: "What's missing" },
  { value: 'other', label: 'Other' },
];

const open = ref(false);
const sending = ref(false);
const error = ref<string | null>(null);
const successId = ref<string | null>(null);

const form = reactive<{ type: string; text: string; screenshotUrl: string | null }>({
  type: 'feature_request',
  text: '',
  screenshotUrl: null,
});

function idShort(id: string): string {
  if (id.length <= 8) return id;
  return `${id.slice(0, 4)}…${id.slice(-4)}`;
}

function closeSuccess() {
  successId.value = null;
  form.text = '';
  form.screenshotUrl = null;
  open.value = false;
}

async function onFileSelect(e: Event) {
  const input = e.target as HTMLInputElement;
  const file = input.files?.[0];
  if (!file) return;
  const formData = new FormData();
  formData.append('file', file);
  formData.append('folder', 'feedback');
  try {
    const res = await fetch(`${API_CONFIG.BASE_URL}/storage/upload`, {
      method: 'POST',
      credentials: 'include',
      body: formData,
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      error.value = data?.error ?? 'Failed to upload file';
      return;
    }
    const data = await res.json();
    form.screenshotUrl = data?.file?.url ?? data?.file?.path ?? null;
    error.value = null;
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Upload error';
  }
}

async function submit() {
  error.value = null;
  if (!form.text.trim()) {
    error.value = 'Please enter a description';
    return;
  }
  sending.value = true;
  try {
    const res = await fetch(`${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.FEEDBACK}`, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: form.type,
        text: form.text.trim(),
        page_url: window.location.href,
        screenshot_url: form.screenshotUrl,
      }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      error.value = data?.error ?? `Error: ${res.status}`;
      return;
    }
    successId.value = data?.id ?? null;
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Failed to submit';
  } finally {
    sending.value = false;
  }
}
</script>

<style scoped>
.feedback-widget {
  position: fixed;
  bottom: 1.5rem;
  right: 1.5rem;
  z-index: 9999;
  font-family: inherit;
}

.feedback-widget__trigger {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.25rem;
  background: var(--color-accent, #0d9488);
  color: #fff;
  border: none;
  border-radius: 2rem;
  font-size: 0.9375rem;
  font-weight: 600;
  cursor: pointer;
  box-shadow: 0 4px 14px rgba(13, 148, 136, 0.4);
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.feedback-widget__trigger:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(13, 148, 136, 0.45);
}

.feedback-widget__trigger:active {
  transform: translateY(0);
}

.feedback-widget__icon {
  display: flex;
  align-items: center;
  justify-content: center;
}

.feedback-widget__panel {
  position: absolute;
  bottom: calc(100% + 0.75rem);
  right: 0;
  width: 380px;
  max-width: calc(100vw - 2rem);
  background: var(--color-bg, #fff);
  border-radius: 1rem;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.15), 0 0 0 1px var(--color-border-light, #e2e8f0);
  overflow: hidden;
}

.feedback-panel-enter-active,
.feedback-panel-leave-active {
  transition: opacity 0.2s ease, transform 0.2s ease;
}

.feedback-panel-enter-from,
.feedback-panel-leave-to {
  opacity: 0;
  transform: translateY(8px);
}

.feedback-widget__panel-inner {
  padding: 1.25rem;
}

.feedback-widget__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 1rem;
}

.feedback-widget__title {
  margin: 0;
  font-size: 1.125rem;
  font-weight: 700;
  color: var(--color-text, #0f172a);
  letter-spacing: -0.02em;
}

.feedback-widget__close {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 2rem;
  height: 2rem;
  padding: 0;
  border: none;
  border-radius: 0.5rem;
  background: transparent;
  color: var(--color-text-muted, #475569);
  cursor: pointer;
  transition: background 0.15s, color 0.15s;
}

.feedback-widget__close:hover {
  background: var(--color-bg-subtle, #e2e8f0);
  color: var(--color-text, #0f172a);
}

.feedback-widget__types {
  margin-bottom: 1rem;
}

.feedback-widget__types-label {
  display: block;
  font-size: 0.8125rem;
  font-weight: 600;
  color: var(--color-text-muted, #475569);
  margin-bottom: 0.5rem;
  text-transform: uppercase;
  letter-spacing: 0.03em;
}

.feedback-widget__pills {
  display: flex;
  flex-wrap: wrap;
  gap: 0.375rem;
}

.feedback-widget__pill {
  cursor: pointer;
  margin: 0;
}

.feedback-widget__pill-input {
  position: absolute;
  opacity: 0;
  pointer-events: none;
}

.feedback-widget__pill-label {
  display: inline-block;
  padding: 0.4rem 0.75rem;
  font-size: 0.8125rem;
  font-weight: 500;
  color: var(--color-text-muted, #475569);
  background: var(--color-bg-subtle, #e2e8f0);
  border-radius: 2rem;
  border: 2px solid transparent;
  transition: color 0.15s, background 0.15s, border-color 0.15s;
}

.feedback-widget__pill-input:checked + .feedback-widget__pill-label {
  color: var(--color-accent-dark, #0f766e);
  background: var(--color-accent-light, #ccfbf1);
  border-color: var(--color-accent, #0d9488);
}

.feedback-widget__pill:hover .feedback-widget__pill-label {
  color: var(--color-text, #0f172a);
  background: var(--color-border-light, #e2e8f0);
}

.feedback-widget__field {
  margin-bottom: 1rem;
}

.feedback-widget__label-text {
  display: block;
  font-size: 0.8125rem;
  font-weight: 600;
  color: var(--color-text-muted, #475569);
  margin-bottom: 0.375rem;
}

.feedback-widget__textarea {
  width: 100%;
  padding: 0.75rem 1rem;
  font-size: 0.9375rem;
  line-height: 1.5;
  color: var(--color-text, #0f172a);
  background: var(--color-bg, #fff);
  border: 1px solid var(--color-border, #cbd5e1);
  border-radius: 0.75rem;
  resize: vertical;
  min-height: 5rem;
  transition: border-color 0.15s, box-shadow 0.15s;
}

.feedback-widget__textarea::placeholder {
  color: var(--color-text-subtle, #94a3b8);
}

.feedback-widget__textarea:focus {
  outline: none;
  border-color: var(--color-accent, #0d9488);
  box-shadow: 0 0 0 3px rgba(13, 148, 136, 0.15);
}

.feedback-widget__upload {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 2.75rem;
  padding: 0.5rem 1rem;
  background: var(--color-bg-subtle, #e2e8f0);
  border: 1px dashed var(--color-border, #cbd5e1);
  border-radius: 0.75rem;
  cursor: pointer;
  transition: border-color 0.15s, background 0.15s;
}

.feedback-widget__upload:hover {
  background: var(--color-border-light, #e2e8f0);
  border-color: var(--color-accent-muted, #5eead4);
}

.feedback-widget__upload-input {
  position: absolute;
  width: 0.1px;
  height: 0.1px;
  opacity: 0;
  overflow: hidden;
  z-index: -1;
}

.feedback-widget__upload-text {
  font-size: 0.875rem;
  color: var(--color-text-muted, #475569);
}

.feedback-widget__error {
  margin: 0 0 0.75rem;
  padding: 0.5rem 0.75rem;
  font-size: 0.8125rem;
  color: var(--color-error, #dc2626);
  background: var(--color-error-bg, #fee2e2);
  border-radius: 0.5rem;
}

.feedback-widget__actions {
  display: flex;
  gap: 0.5rem;
  justify-content: flex-end;
  margin-top: 1rem;
  padding-top: 0.75rem;
  border-top: 1px solid var(--color-border-light, #e2e8f0);
}

.feedback-widget__btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.375rem;
  padding: 0.5rem 1rem;
  font-size: 0.875rem;
  font-weight: 600;
  border-radius: 0.5rem;
  border: 1px solid var(--color-border, #cbd5e1);
  background: transparent;
  color: var(--color-text, #0f172a);
  cursor: pointer;
  transition: background 0.15s, border-color 0.15s, color 0.15s;
}

.feedback-widget__btn:hover:not(:disabled) {
  background: var(--color-bg-subtle, #e2e8f0);
}

.feedback-widget__btn--primary {
  background: var(--color-accent, #0d9488);
  border-color: var(--color-accent, #0d9488);
  color: #fff;
}

.feedback-widget__btn--primary:hover:not(:disabled) {
  background: var(--color-accent-hover, #0f766e);
  border-color: var(--color-accent-hover, #0f766e);
}

.feedback-widget__btn--primary:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

.feedback-widget__spinner {
  width: 1rem;
  height: 1rem;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-top-color: #fff;
  border-radius: 50%;
  animation: feedback-spin 0.7s linear infinite;
}

@keyframes feedback-spin {
  to { transform: rotate(360deg); }
}

.feedback-widget__success {
  text-align: center;
  padding: 0.5rem 0;
}

.feedback-widget__success-icon {
  color: var(--color-success, #059669);
  margin-bottom: 1rem;
}

.feedback-widget__success-text {
  margin: 0 0 1.25rem;
  font-size: 0.9375rem;
  line-height: 1.5;
  color: var(--color-text, #0f172a);
}

.feedback-widget__success-text strong {
  font-weight: 700;
  color: var(--color-accent, #0d9488);
}
</style>
