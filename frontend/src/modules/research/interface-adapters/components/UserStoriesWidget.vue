<template>
  <div class="user-stories-widget">
    <div class="user-stories-widget-header">
      <h3 class="user-stories-widget-title">AI-Generated User Stories</h3>
      <p class="user-stories-widget-status" aria-live="polite">
        <template v-if="presenter.viewModel.isGeneratingUserStories">Generating…</template>
        <template v-else-if="presenter.viewModel.userStoriesError">Generation failed</template>
        <template v-else-if="presenter.viewModel.userStories.length">Generated ({{ presenter.viewModel.userStories.length }} stories)</template>
        <template v-else>Not generated yet</template>
      </p>
      <div class="user-stories-widget-actions">
        <button
          v-if="!presenter.viewModel.userStories.length"
          type="button"
          @click="generateUserStories"
          :disabled="presenter.viewModel.isGeneratingUserStories"
          class="user-stories-btn user-stories-btn--primary"
        >
          <svg v-if="presenter.viewModel.isGeneratingUserStories" class="user-stories-btn-spinner" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          {{ presenter.viewModel.isGeneratingUserStories ? 'Generating User Stories...' : 'Generate User Stories' }}
        </button>
        <button
          v-if="presenter.viewModel.userStories.length"
          type="button"
          @click="openStoriesPopup"
          class="user-stories-btn user-stories-btn--secondary"
        >
          <svg class="user-stories-btn-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
          </svg>
          View text
        </button>
        <button
          v-if="presenter.viewModel.userStories.length"
          type="button"
          @click="regenerateUserStories"
          :disabled="presenter.viewModel.isGeneratingUserStories"
          class="user-stories-btn user-stories-btn--secondary"
        >
          <svg class="user-stories-btn-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>
          </svg>
          Regenerate
        </button>
      </div>
    </div>

    <div v-if="presenter.viewModel.userStoriesError" class="mb-4 p-4 bg-red-50 border border-red-200 rounded-md">
      <div class="flex">
        <div class="flex-shrink-0">
          <svg class="h-5 w-5 text-red-400" fill="currentColor" viewBox="0 0 20 20">
            <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd"></path>
          </svg>
        </div>
        <div class="ml-3 flex-1 min-w-0">
          <p class="text-sm font-medium text-red-800">User stories were not generated.</p>
          <p class="text-sm text-red-700 mt-1">{{ presenter.viewModel.userStoriesError }}</p>
          <p v-if="presenter.viewModel.userStoriesErrorPreview" class="text-xs text-red-600 mt-2">Response preview (for debugging):</p>
          <pre v-if="presenter.viewModel.userStoriesErrorPreview" class="mt-1 text-xs text-red-700 bg-red-100/80 p-2 rounded overflow-x-auto whitespace-pre-wrap break-words max-h-48 overflow-y-auto">{{ presenter.viewModel.userStoriesErrorPreview }}</pre>
        </div>
      </div>
    </div>

    <div v-if="presenter.viewModel.userStories.length" class="user-stories-success-and-carousel">
      <div class="mt-4 p-4 bg-green-50 border border-green-200 rounded-md">
        <div class="flex items-center">
          <div class="flex-shrink-0">
            <svg class="h-5 w-5 text-green-400" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"></path>
            </svg>
          </div>
          <div class="ml-3">
            <p class="text-sm text-green-800">
              User stories generated successfully!
              <span class="font-medium">{{ presenter.viewModel.userStories.length }} user stories across {{ getFunctionalAreasCount() }} functional areas</span>
            </p>
            <p class="text-sm text-green-700 mt-1">
              Generated {{ presenter.viewModel.userStoriesGeneratedAt ? formatDate(presenter.viewModel.userStoriesGeneratedAt) : 'recently' }}
            </p>
          </div>
        </div>
      </div>
    </div>

    <div v-else-if="!presenter.viewModel.isGeneratingUserStories" class="text-center py-8">
      <h3 class="mt-2 text-sm font-medium text-gray-900">No user stories generated</h3>
      <p class="mt-1 text-sm text-gray-500">Generate user stories based on your project analysis to understand user needs and guide development.</p>
    </div>
  </div>

  <!-- Popup: same identity as tips-popup (tips-overlay, tips-popup, carousel with arrows/dots) -->
  <Teleport to="body">
    <Transition name="tips-popup">
      <div v-if="showTextPopup && presenter.viewModel.userStories.length" class="user-stories-popup-ident tips-overlay" @click="showTextPopup = false">
        <div class="tips-popup" @click.stop role="dialog" aria-modal="true" aria-labelledby="user-stories-popup-title">
          <div class="tips-popup-header">
            <h3 id="user-stories-popup-title" class="tips-popup-title">User Stories</h3>
            <button type="button" class="tips-popup-close" aria-label="Close" @click="showTextPopup = false">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <div class="tips-popup-body">
            <div class="tips-header">
              <div class="tips-nav">
                <button
                  type="button"
                  class="tips-btn tips-btn-prev"
                  :disabled="currentStoryIndex === 0"
                  aria-label="Previous story"
                  @click="prevStory"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                <span class="tips-counter">{{ currentStoryIndex + 1 }} / {{ presenter.viewModel.userStories.length }}</span>
                <button
                  type="button"
                  class="tips-btn tips-btn-next"
                  :disabled="currentStoryIndex === presenter.viewModel.userStories.length - 1"
                  aria-label="Next story"
                  @click="nextStory"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>
            </div>
            <div class="tips-dots" role="tablist" aria-label="Story pages">
              <button
                v-for="(story, idx) in presenter.viewModel.userStories"
                :key="story.id"
                type="button"
                class="tips-dot"
                :class="{ active: idx === currentStoryIndex }"
                :aria-label="`Story ${idx + 1}: ${story.goal}`"
                :aria-selected="idx === currentStoryIndex"
                role="tab"
                @click="currentStoryIndex = idx"
              />
            </div>
            <div class="tips-slide">
              <div
                v-for="(story, idx) in presenter.viewModel.userStories"
                :key="story.id"
                v-show="idx === currentStoryIndex"
                class="tips-card"
              >
                <h4 class="tips-card-title">{{ story.goal }}</h4>
                <div class="tips-card-body">
                  <p class="tips-p"><strong>{{ story.role }}</strong> · {{ story.benefit }}</p>
                  <p class="tips-p user-stories-card-meta-inline">{{ story.priority }} · {{ story.functionalArea }}</p>
                  <div v-if="story.solutionDirection" class="user-stories-direction">
                    <strong>Recommended direction:</strong> {{ story.solutionDirection }}
                  </div>
                  <ul v-if="story.acceptanceCriteria?.length" class="tips-list">
                    <li v-for="(c, i) in story.acceptanceCriteria" :key="i">{{ c }}</li>
                  </ul>
                </div>
              </div>
            </div>
            <div class="tips-popup-footer">
              <button type="button" class="user-stories-modal-btn user-stories-modal-btn--secondary" @click="showTextPopup = false">
                Close
              </button>
              <button type="button" class="user-stories-modal-btn user-stories-modal-btn--primary" @click="copyToClipboard">
                Copy to Clipboard
              </button>
            </div>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { FileText, X } from 'lucide-vue-next'
import { container } from '@/infrastructure/bootstrap/container'
import { TYPES } from '../../infrastructure/bootstrap/types'
import type { ResearchPresenter } from '../presenters/research.presenter'

interface Props {
  projectId: string
}

const props = defineProps<Props>()

// Get presenter from DI container
const presenter = container.get<ResearchPresenter>(TYPES.ResearchPresenter)

// Modal state
const showTextPopup = ref(false)

// Carousel: current story index (0-based), flip with arrows like Tips
const currentStoryIndex = ref(0)

function prevStory() {
  if (currentStoryIndex.value > 0) currentStoryIndex.value--
}

function nextStory() {
  const total = presenter.viewModel.userStories.length
  if (currentStoryIndex.value < total - 1) currentStoryIndex.value++
}

function openStoriesPopup() {
  currentStoryIndex.value = 0
  showTextPopup.value = true
}

// Reset carousel index when stories list changes (e.g. after Regenerate)
watch(
  () => presenter.viewModel.userStories.length,
  () => {
    currentStoryIndex.value = 0
  }
)

const formatDate = (date: Date) => {
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).format(new Date(date))
}

const getFunctionalAreasCount = () => {
  const areas = new Set(presenter.viewModel.userStories.map(story => story.functionalArea))
  return areas.size
}

const generateUserStories = async () => {
  await presenter.generateUserStories(props.projectId)
}

const regenerateUserStories = async () => {
  await presenter.regenerateUserStories(props.projectId)
}

// Load existing user stories on component mount
import { onMounted } from 'vue'
onMounted(async () => {
  await presenter.getResearchCanvas(props.projectId)
})

/** Format user stories as plain text for display and copy. */
const generatePlainText = () => {
  const stories = presenter.viewModel.userStories
  const generatedAt = presenter.viewModel.userStoriesGeneratedAt

  let text = `AI-Generated User Stories\n\n`

  if (generatedAt) {
    text += `Generated on ${formatDate(generatedAt)}\n\n`
  }

  text += `Overview\n`
  text += `Total Stories: ${stories.length}\n`
  text += `Functional Areas: ${getFunctionalAreasCount()}\n\n`

  const highPriority = stories.filter(s => s.priority === 'high')
  const mediumPriority = stories.filter(s => s.priority === 'medium')
  const lowPriority = stories.filter(s => s.priority === 'low')

  if (highPriority.length > 0) {
    text += `High Priority Stories\n\n`
    highPriority.forEach((story, index) => {
      text += formatStoryText(story, index + 1)
    })
  }

  if (mediumPriority.length > 0) {
    text += `Medium Priority Stories\n\n`
    mediumPriority.forEach((story, index) => {
      text += formatStoryText(story, index + 1)
    })
  }

  if (lowPriority.length > 0) {
    text += `Low Priority Stories\n\n`
    lowPriority.forEach((story, index) => {
      text += formatStoryText(story, index + 1)
    })
  }

  return text
}

const formatStoryText = (story: any, number: number) => {
  let t = `${number}. ${story.role}\n\n`
  t += `Goal: ${story.goal}\n\n`
  t += `Benefit: ${story.benefit}\n\n`
  t += `Priority: ${story.priority}\n\n`
  t += `Functional Area: ${story.functionalArea}\n\n`
  if (story.solutionDirection) {
    t += `Recommended direction: ${story.solutionDirection}\n\n`
  }
  if (story.acceptanceCriteria && story.acceptanceCriteria.length > 0) {
    t += `Acceptance Criteria:\n`
    story.acceptanceCriteria.forEach((criteria: string, index: number) => {
      t += `${index + 1}. ${criteria}\n`
    })
    t += `\n`
  }

  t += `\n`
  return t
}

const copyToClipboard = async () => {
  try {
    await navigator.clipboard.writeText(generatePlainText())
    // You could add a toast notification here
  } catch (err) {
    console.error('Failed to copy: ', err)
  }
}

// Component is ready to use presenter for data management
</script>

<style scoped>
.user-stories-widget {
  position: relative;
  @apply bg-white rounded-lg shadow-sm border border-gray-200 p-6;
}

.user-stories-success-and-carousel {
  margin-top: 0.5rem;
}

.user-stories-carousel {
  margin-top: 1rem;
  padding: 1rem;
  background: var(--color-bg-subtle, #f8fafc);
  border: 1px solid var(--color-border-light, #e2e8f0);
  border-radius: var(--radius-lg, 0.5rem);
}

.user-stories-carousel--in-modal {
  margin-top: 0;
  margin-bottom: 0;
  padding: 0.75rem 0;
  background: transparent;
  border: none;
}

.user-stories-nav {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 1rem;
  margin-bottom: 0.75rem;
}

.user-stories-nav-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 2.25rem;
  height: 2.25rem;
  padding: 0;
  border: 1px solid var(--color-border-light, #e2e8f0);
  border-radius: var(--radius-md, 0.375rem);
  background: var(--color-bg);
  color: var(--color-text);
  cursor: pointer;
  transition: background 0.2s, color 0.2s, border-color 0.2s;
}

.user-stories-nav-btn:hover:not(:disabled) {
  background: var(--color-bg-elevated, #f1f5f9);
  border-color: var(--color-accent-muted, #94a3b8);
  color: var(--color-accent);
}

.user-stories-nav-btn:disabled {
  opacity: 0.45;
  cursor: not-allowed;
}

.user-stories-nav-btn svg {
  width: 1.25rem;
  height: 1.25rem;
}

.user-stories-counter {
  font-size: var(--text-sm, 0.875rem);
  font-weight: 500;
  color: var(--color-text-muted, #64748b);
  min-width: 3rem;
  text-align: center;
}

.user-stories-dots {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.375rem;
  margin-bottom: 1rem;
}

.user-stories-dot {
  width: 0.5rem;
  height: 0.5rem;
  padding: 0;
  border: none;
  border-radius: 50%;
  background: var(--color-border-light, #cbd5e1);
  cursor: pointer;
  transition: background 0.2s, transform 0.2s;
}

.user-stories-dot:hover {
  background: var(--color-text-muted, #94a3b8);
}

.user-stories-dot.active {
  background: var(--color-accent);
  transform: scale(1.2);
}

.user-stories-slide {
  position: relative;
  min-height: 8rem;
}

.user-stories-card {
  animation: user-stories-fade 0.2s ease;
}

@keyframes user-stories-fade {
  from { opacity: 0; }
  to { opacity: 1; }
}

.user-stories-card-role {
  margin: 0 0 0.25rem 0;
  font-size: var(--text-sm, 0.875rem);
  color: var(--color-text-muted, #64748b);
  text-transform: capitalize;
}

.user-stories-card-goal {
  margin: 0 0 0.5rem 0;
  font-size: var(--text-base, 1rem);
  font-weight: 600;
  color: var(--color-text);
  line-height: 1.35;
}

.user-stories-card-benefit {
  margin: 0 0 0.5rem 0;
  font-size: var(--text-sm, 0.875rem);
  color: var(--color-text);
  line-height: 1.45;
}

.user-stories-card-meta {
  margin: 0 0 0.5rem 0;
  font-size: var(--text-xs, 0.75rem);
  color: var(--color-text-muted, #64748b);
}

.user-stories-card-priority {
  text-transform: capitalize;
  margin-right: 0.5rem;
}

.user-stories-card-direction {
  margin: 0.5rem 0;
  padding: 0.5rem 0.75rem;
  background: rgba(34, 197, 94, 0.08);
  border-left: 3px solid var(--color-accent, #0d9488);
  font-size: var(--text-sm, 0.875rem);
  color: var(--color-text);
  border-radius: 0 4px 4px 0;
}

.user-stories-card-criteria {
  margin: 0.5rem 0 0 0;
  padding-left: 1.25rem;
  font-size: var(--text-sm, 0.875rem);
  color: var(--color-text);
  line-height: 1.5;
}

.user-stories-card-criteria li {
  margin-bottom: 0.25rem;
}
</style>

<!-- Кнопки и модалка без scoped — гарантированно применяются -->
<style>
/* Кнопки виджета (глобально) */
.user-stories-widget-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 1rem;
  gap: 1rem;
  flex-wrap: wrap;
}

.user-stories-widget-title {
  margin: 0;
  font-size: var(--text-lg, 1.125rem);
  font-weight: var(--font-weight-semibold, 600);
  color: var(--color-text, #0f172a);
}

.user-stories-widget-status {
  margin: 0;
  font-size: var(--text-sm, 0.875rem);
  color: var(--color-text-muted, #64748b);
}

.user-stories-widget-actions {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.user-stories-btn {
  display: inline-flex;
  align-items: center;
  padding: 0.5rem 0.75rem;
  font-size: var(--text-sm, 0.875rem);
  font-weight: var(--font-weight-medium, 500);
  border-radius: var(--radius-md, 0.5rem);
  cursor: pointer;
  transition: color 0.2s, background 0.2s, border-color 0.2s, opacity 0.2s;
  border: 1px solid transparent;
}

.user-stories-btn:focus-visible {
  outline: 2px solid var(--color-accent);
  outline-offset: 2px;
}

.user-stories-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.user-stories-btn-icon,
.user-stories-btn-spinner {
  width: 1rem;
  height: 1rem;
  margin-right: 0.5rem;
  flex-shrink: 0;
}

.user-stories-btn-spinner {
  animation: user-stories-spin 0.8s linear infinite;
}

@keyframes user-stories-spin {
  to {
    transform: rotate(360deg);
  }
}

.user-stories-btn--primary {
  background: var(--color-accent);
  color: #fff;
  border-color: var(--color-accent);
}

.user-stories-btn--primary:hover:not(:disabled) {
  background: var(--color-accent-hover);
  border-color: var(--color-accent-hover);
}

.user-stories-btn--secondary {
  background: var(--color-bg);
  color: var(--color-text);
  border-color: var(--color-border-light, #e2e8f0);
}

.user-stories-btn--secondary:hover:not(:disabled) {
  background: var(--color-bg-elevated, #f1f5f9);
  color: var(--color-text);
  border-color: var(--color-accent-muted, #cbd5e1);
}

/* Popup: same identity as tips-popup (only when .user-stories-popup-ident is present) */
.user-stories-popup-ident.tips-overlay {
  position: fixed;
  inset: 0;
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1.5rem;
  background: rgba(0, 0, 0, 0.4);
  overflow-y: auto;
}

.user-stories-popup-ident .tips-popup {
  width: 100%;
  max-width: 36rem;
  max-height: calc(100vh - 3rem);
  display: flex;
  flex-direction: column;
  background: var(--color-bg-page);
  border-radius: 0.75rem;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.2);
  overflow: hidden;
}

.user-stories-popup-ident .tips-popup-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  padding: 1rem 1.25rem;
  border-bottom: var(--border-width) var(--border-style) var(--color-border);
  flex-shrink: 0;
}

.user-stories-popup-ident .tips-popup-title {
  font-size: 0.9375rem;
  font-weight: 600;
  color: var(--color-text);
  margin: 0;
  flex: 1;
  min-width: 0;
}

.user-stories-popup-ident .tips-popup-close {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 2rem;
  height: 2rem;
  padding: 0;
  border: none;
  background: none;
  color: var(--color-text-muted);
  cursor: pointer;
  border-radius: 6px;
  transition: background 0.2s, color 0.2s;
}

.user-stories-popup-ident .tips-popup-close:hover {
  background: var(--color-bg-subtle);
  color: var(--color-text);
}

.user-stories-popup-ident .tips-popup-close svg {
  width: 1.25rem;
  height: 1.25rem;
}

.user-stories-popup-ident .tips-popup-body {
  padding: 1rem 1.25rem 1.25rem;
  overflow-y: auto;
  flex: 1;
  min-height: 0;
}

.user-stories-popup-ident .tips-header {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  margin-bottom: 0.5rem;
}

.user-stories-popup-ident .tips-nav {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.user-stories-popup-ident .tips-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 2rem;
  height: 2rem;
  padding: 0;
  border: 1px solid var(--color-border);
  border-radius: 6px;
  background: var(--color-bg);
  color: var(--color-text-muted);
  cursor: pointer;
  transition: background 0.2s, color 0.2s;
}

.user-stories-popup-ident .tips-btn:hover:not(:disabled) {
  background: var(--color-bg-subtle);
  color: var(--color-text);
}

.user-stories-popup-ident .tips-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.user-stories-popup-ident .tips-btn svg {
  width: 1rem;
  height: 1rem;
}

.user-stories-popup-ident .tips-counter {
  font-size: 0.75rem;
  color: var(--color-text-muted);
  min-width: 2.5rem;
  text-align: center;
}

.user-stories-popup-ident .tips-dots {
  display: flex;
  justify-content: center;
  gap: 0.35rem;
  margin-bottom: 0.75rem;
}

.user-stories-popup-ident .tips-dot {
  width: 6px;
  height: 6px;
  padding: 0;
  border: none;
  border-radius: 50%;
  background: var(--color-border);
  cursor: pointer;
  transition: background 0.2s, transform 0.2s;
}

.user-stories-popup-ident .tips-dot:hover {
  background: var(--color-text-muted);
}

.user-stories-popup-ident .tips-dot.active {
  background: var(--color-accent, #0f766e);
  transform: scale(1.25);
}

.user-stories-popup-ident .tips-slide {
  min-height: 8rem;
  position: relative;
}

.user-stories-popup-ident .tips-card {
  animation: tips-fade 0.2s ease;
}

@keyframes tips-fade {
  from { opacity: 0; }
  to { opacity: 1; }
}

.user-stories-popup-ident .tips-card-title {
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--color-text);
  margin: 0 0 0.5rem 0;
}

.user-stories-popup-ident .tips-card-body {
  font-size: 0.8125rem;
  color: var(--color-text);
  line-height: 1.5;
}

.user-stories-popup-ident .tips-p {
  margin: 0 0 0.5rem 0;
}

.user-stories-popup-ident .tips-p:last-child {
  margin-bottom: 0;
}

.user-stories-popup-ident .tips-list {
  margin: 0.25rem 0 0.5rem 1.25rem;
  padding: 0;
}

.user-stories-popup-ident .tips-list li {
  margin-bottom: 0.25rem;
}

.user-stories-popup-ident .user-stories-card-meta-inline {
  font-size: 0.75rem;
  color: var(--color-text-muted);
}

.user-stories-popup-ident .user-stories-direction {
  margin: 0.5rem 0;
  padding: 0.5rem 0.75rem;
  background: rgba(15, 118, 110, 0.08);
  border-left: 3px solid var(--color-accent, #0f766e);
  border-radius: 0 4px 4px 0;
  font-size: 0.8125rem;
}

.user-stories-popup-ident .tips-popup-footer {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 0.5rem;
  padding: 1rem 1.25rem 0 0;
  margin-top: 0.5rem;
  border-top: var(--border-width) var(--border-style) var(--color-border);
  flex-shrink: 0;
}

/* Transition (same as Tips) */
.tips-popup-enter-active,
.tips-popup-leave-active {
  transition: opacity 0.2s ease;
}

.tips-popup-enter-active .tips-popup,
.tips-popup-leave-active .tips-popup {
  transition: transform 0.2s ease;
}

.tips-popup-enter-from,
.tips-popup-leave-to {
  opacity: 0;
}

.tips-popup-enter-from .tips-popup,
.tips-popup-leave-to .tips-popup {
  transform: scale(0.96);
}

/* Buttons in popup footer */
.user-stories-modal-btn {
  padding: 0.4rem 0.75rem;
  font-size: 0.8125rem;
  font-weight: 500;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s;
}

.user-stories-modal-btn--secondary {
  border: 1px solid var(--color-border);
  background: var(--color-bg);
  color: var(--color-text);
}

.user-stories-modal-btn--secondary:hover {
  background: var(--color-bg-subtle);
}

.user-stories-modal-btn--primary {
  border: none;
  background: var(--color-accent, #0f766e);
  color: #fff;
}

.user-stories-modal-btn--primary:hover {
  background: var(--color-accent-hover, #0d9488);
}
</style>