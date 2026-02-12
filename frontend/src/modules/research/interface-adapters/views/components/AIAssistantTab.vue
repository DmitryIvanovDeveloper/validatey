<template>
  <div class="ai-assistant-tab-view">
    <!-- AI Research Co-pilot -->
    <div class="section-card assistant-card">
      <div class="section-card-header">
        <span class="section-icon section-icon-assistant" aria-hidden="true">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
          </svg>
        </span>
        <div>
          <h3 class="section-title">AI Research Co-pilot</h3>
          <p class="section-subtitle">Ask any question about your research</p>
        </div>
      </div>

      <div class="assistant-content">
        <!-- Example Questions -->
        <div class="example-questions-section">
          <p class="example-questions-label">Example questions:</p>
          <div class="example-questions-grid">
            <button
              v-for="question in exampleQuestions"
              :key="question"
              @click="sendExampleQuestion(question)"
              class="example-question-btn"
            >
              {{ question }}
            </button>
          </div>
        </div>

        <!-- Chat Messages -->
        <div class="chat-container">
          <div ref="messagesEl" class="chat-messages">
            <div v-if="!messages.length" class="state state-empty">
              <span class="state-icon" aria-hidden="true">💬</span>
              <p class="state-title">Ask about methods, sample size, or data interpretation</p>
              <p class="state-desc">For example: "How to best validate this hypothesis?", "What questions to ask in the survey?"</p>
            </div>

            <div
              v-for="(message, index) in messages"
              :key="index"
              class="message-wrapper"
              :class="message.role === 'user' ? 'message-user' : 'message-assistant'"
            >
              <div class="message-bubble">
                <div class="message-sender">
                  {{ message.role === 'user' ? 'You' : 'Co-pilot' }}
                </div>
                <div class="message-content">{{ message.content }}</div>

                <!-- Suggested Methods -->
                <ul v-if="message.suggestedMethods?.length" class="message-suggestions">
                  <li v-for="method in message.suggestedMethods" :key="method" class="suggestion-item">
                    • {{ method }}
                  </li>
                </ul>

                <!-- Clarification Questions -->
                <ul v-if="message.clarificationQuestions?.length" class="message-questions">
                  <li v-for="question in message.clarificationQuestions" :key="question" class="question-item">
                    ? {{ question }}
                  </li>
                </ul>
              </div>
            </div>
          </div>

          <!-- Message Input -->
          <div class="chat-input-section">
            <form @submit.prevent="sendMessage" class="chat-input-form">
              <input
                v-model="inputMessage"
                type="text"
                placeholder="Ask about your research..."
                class="chat-input-field"
                :disabled="loading"
              />
              <button
                type="submit"
                @click="sendMessage"
                :disabled="loading || !inputMessage.trim()"
                class="chat-send-btn"
                aria-label="Send message"
              >
                <svg v-if="!loading" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="send-icon">
                  <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z"/>
                </svg>
                <div v-else class="loading-spinner"></div>
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, nextTick, onMounted, watch } from 'vue';
import { container } from '../../../../../infrastructure/bootstrap/container';
import { ResearchPresenter } from '../../presenters/research.presenter';
import { TYPES } from '../../../infrastructure/bootstrap/types';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  suggestedMethods?: string[];
  clarificationQuestions?: string[];
}

interface Props {
  projectId?: string;
}

const props = defineProps<Props>();

// State
const messages = ref<Message[]>([]);
const inputMessage = ref('');
const loading = ref(false);
const messagesEl = ref<HTMLElement | null>(null);

const presenter = container.get<ResearchPresenter>(TYPES.ResearchPresenter);

// Example questions
const exampleQuestions = [
  'How to best validate this hypothesis?',
  'What questions should I ask in the survey?',
  'How many responses do I need for statistical significance?',
  'How to interpret the competitor data?',
];

// Methods
const scrollToBottom = () => {
  nextTick(() => {
    if (messagesEl.value) {
      messagesEl.value.scrollTop = messagesEl.value.scrollHeight;
    }
  });
};

const sendExampleQuestion = (question: string) => {
  inputMessage.value = question;
  sendMessage();
};

const sendMessage = async () => {
  const message = inputMessage.value.trim();
  if (!message || !props.projectId) return;

  // Add user message
  messages.value.push({ role: 'user', content: message });
  inputMessage.value = '';
  loading.value = true;
  scrollToBottom();

  try {
    const result = await presenter.askAssistant(props.projectId, message);

    messages.value.push({
      role: 'assistant',
      content: result.reply,
      suggestedMethods: result.suggestedMethods,
      clarificationQuestions: result.clarificationQuestions,
    });
  } catch (error) {
    messages.value.push({
      role: 'assistant',
      content: 'Sorry, an error occurred. Please try again.',
    });
  } finally {
    loading.value = false;
    scrollToBottom();
  }
};

// Watch for new messages to scroll
watch(messages, scrollToBottom, { deep: true });

onMounted(() => {
  scrollToBottom();
});
</script>

<style scoped>
.ai-assistant-tab-view {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

/* Section cards */
.section-card {
  background: var(--color-bg);
  border: 1px solid var(--color-border-light);
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-sm);
  transition: box-shadow 0.2s, border-color 0.2s;
}

.section-card:hover {
  box-shadow: var(--shadow-md);
}

.section-card-header {
  display: flex;
  align-items: flex-start;
  gap: 1rem;
  padding: 1.5rem;
  border-bottom: 1px solid var(--color-border-light);
}

.section-icon {
  flex-shrink: 0;
  width: 40px;
  height: 40px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--color-accent, #0d9488);
}

.section-icon-assistant {
  background: rgba(13, 148, 136, 0.1);
}

.section-title {
  font-size: 1.125rem;
  font-weight: 600;
  color: var(--color-text, #0f172a);
  margin: 0 0 0.15rem 0;
  letter-spacing: -0.01em;
}

.section-subtitle {
  font-size: 0.8125rem;
  color: var(--color-text-muted, #64748b);
  margin: 0;
  line-height: 1.4;
}

.assistant-content {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.example-questions-section {
  padding: 0 1.5rem;
}

.example-questions-label {
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--color-text-muted);
  margin: 0 0 0.75rem 0;
}

.example-questions-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.example-question-btn {
  padding: 0.5rem 1rem;
  background: var(--color-bg-subtle, #f8fafc);
  color: var(--color-text);
  border: 1px solid var(--color-border-light);
  border-radius: 6px;
  font-size: 0.8125rem;
  cursor: pointer;
  transition: all 0.2s ease;
}

.example-question-btn:hover {
  background: var(--color-accent, #0d9488);
  color: white;
  border-color: var(--color-accent, #0d9488);
}

.chat-container {
  border: 1px solid var(--color-border-light);
  border-radius: 8px;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.chat-messages {
  flex: 1;
  max-height: 24rem;
  overflow-y: auto;
  padding: 1rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.message-wrapper {
  display: flex;
  flex-direction: column;
}

.message-user {
  align-items: flex-end;
}

.message-assistant {
  align-items: flex-start;
}

.message-bubble {
  max-width: 28rem;
  padding: 0.75rem 1rem;
  border-radius: 12px;
  font-size: 0.875rem;
  line-height: 1.5;
}

.message-user .message-bubble {
  background: var(--color-accent, #0d9488);
  color: white;
}

.message-assistant .message-bubble {
  background: var(--color-bg-subtle, #f8fafc);
  color: var(--color-text);
  border: 1px solid var(--color-border-light);
}

.message-sender {
  font-size: 0.75rem;
  font-weight: 600;
  margin-bottom: 0.5rem;
  opacity: 0.8;
}

.message-content {
  margin-bottom: 0.75rem;
}

.message-suggestions,
.message-questions {
  margin: 0;
  padding: 0;
  list-style: none;
}

.suggestion-item,
.question-item {
  padding: 0.25rem 0;
  font-size: 0.8125rem;
  color: var(--color-text-muted);
  position: relative;
  padding-left: 1rem;
}

.suggestion-item:before,
.question-item:before {
  position: absolute;
  left: 0;
  font-weight: bold;
}

.suggestion-item:before {
  content: '•';
  color: var(--color-accent, #0d9488);
}

.question-item:before {
  content: '?';
  color: #f59e0b;
}

.chat-input-section {
  border-top: 1px solid var(--color-border-light);
  padding: 1rem;
  background: var(--color-bg);
}

.chat-input-form {
  display: flex;
  gap: 0.75rem;
  align-items: center;
}

.chat-input-field {
  flex: 1;
  padding: 0.75rem 1rem;
  border: 1px solid var(--color-border-light);
  border-radius: 8px;
  font-size: 0.875rem;
  font-family: inherit;
  color: var(--color-text);
  background: var(--color-bg);
  transition: border-color 0.2s, box-shadow 0.2s;
}

.chat-input-field:focus {
  outline: none;
  border-color: var(--color-accent, #0d9488);
  box-shadow: 0 0 0 3px rgba(13, 148, 136, 0.12);
}

.chat-input-field:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.chat-send-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 2.5rem;
  height: 2.5rem;
  background: var(--color-accent, #0d9488);
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  transition: background 0.2s;
}

.chat-send-btn:hover:not(:disabled) {
  background: var(--color-accent-hover, #0f766e);
}

.chat-send-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.send-icon {
  width: 1rem;
  height: 1rem;
}

.loading-spinner {
  width: 1rem;
  height: 1rem;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-top-color: white;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

/* States */
.state {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.75rem;
  padding: 2.5rem 1.5rem;
  font-size: 0.9375rem;
  text-align: center;
  flex-direction: column;
  background: var(--color-bg);
  border: 1px dashed var(--color-border-light);
  border-radius: var(--radius-md);
}

.state-empty {
  color: var(--color-text-muted);
}

.state-icon {
  font-size: 2rem;
}

.state-title {
  font-weight: 600;
  color: var(--color-text, #0f172a);
  margin: 0.5rem 0 0.25rem 0;
}

.state-desc {
  color: var(--color-text-muted, #64748b);
  margin: 0;
  font-size: 0.875rem;
}

@media (max-width: 640px) {
  .chat-input-form {
    flex-direction: column;
  }

  .chat-send-btn {
    width: 100%;
  }

  .message-bubble {
    max-width: 100%;
  }

  .example-questions-grid {
    flex-direction: column;
  }

  .example-question-btn {
    width: 100%;
    text-align: left;
  }
}
</style>