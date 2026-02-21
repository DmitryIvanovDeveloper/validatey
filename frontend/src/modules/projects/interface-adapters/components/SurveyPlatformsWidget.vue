<template>
  <div class="survey-platforms-widget">
    <!-- Header -->
    <div class="spw-header">
      <div class="spw-header-left">
        <svg class="spw-icon" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
        </svg>
        <div>
          <h3 class="spw-title">Survey Distribution Platforms</h3>
          <p class="spw-subtitle">AI-powered platform recommendations</p>
        </div>
      </div>
      <button
        class="spw-generate-btn"
        @click="generatePlatforms"
        :disabled="loading"
      >
        <svg v-if="loading" class="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        <svg v-else class="h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
        </svg>
        {{ loading ? 'Generating...' : 'Generate Platforms' }}
      </button>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="spw-loading">
      <div class="spw-loading-dots">
        <span></span><span></span><span></span>
      </div>
      <span>Analyzing your project to suggest optimal platforms…</span>
    </div>

    <!-- Error -->
    <div v-else-if="error" class="spw-empty">
      <svg class="spw-empty-icon" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
      </svg>
      <p>{{ error }}</p>
    </div>

    <!-- No data -->
    <div v-else-if="!platforms || platforms.length === 0" class="spw-empty">
      <svg class="spw-empty-icon" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
      </svg>
      <p>Ready to find the best platforms for your survey.</p>
      <p class="spw-empty-hint">Click "Generate Platforms" to get AI-powered recommendations.</p>
    </div>

    <!-- Platforms list -->
    <div v-else class="spw-platforms">
      <div
        v-for="platform in platforms"
        :key="platform.platform"
        class="spw-platform-card"
      >
        <div class="spw-platform-header">
          <div class="spw-platform-main">
            <div class="spw-platform-name-row">
              <div class="spw-platform-icon-wrapper">
                <svg class="spw-platform-icon" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m13.35-.622l1.757-1.757a4.5 4.5 0 00-6.364-6.364l-4.5 4.5a4.5 4.5 0 001.242 7.244" />
                </svg>
              </div>
              <div class="spw-platform-title-group">
                <a 
                  :href="getPlatformUrl(platform.platform, platform.subplatform)" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  class="spw-platform-name spw-platform-link"
                >
                  {{ platform.platform }}
                </a>
                <template v-if="platform.subplatform">
                  <template v-if="getSubplatformLinks(platform.platform, platform.subplatform).length > 0">
                    <a
                      v-for="(link, index) in getSubplatformLinks(platform.platform, platform.subplatform)"
                      :key="index"
                      :href="link.url"
                      target="_blank"
                      rel="noopener noreferrer"
                      class="spw-platform-sub spw-platform-sub-link"
                    >
                      {{ link.text }}
                    </a>
                  </template>
                  <span v-else class="spw-platform-sub">{{ platform.subplatform }}</span>
                </template>
              </div>
            </div>
            <div class="spw-platform-meta">
              <div class="spw-platform-reach-badge">
                <svg class="spw-reach-icon" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
                </svg>
                <span>{{ platform.expectedReach }}</span>
              </div>
            </div>
          </div>
          <div class="spw-platform-strategy">
            <svg class="spw-strategy-icon" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
            </svg>
            <span>{{ platform.postingStrategy }}</span>
          </div>
        </div>

        <div class="spw-platform-reason">
          <svg class="spw-reason-icon" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
          </svg>
          <p>{{ platform.reason }}</p>
        </div>

        <!-- Post content -->
        <div class="spw-platform-post">
          <div class="spw-post-header">
            <div class="spw-post-label-wrapper">
              <svg class="spw-post-label-icon" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
              </svg>
              <span class="spw-post-label">Ready-to-post message</span>
            </div>
            <button
              type="button"
              class="spw-copy-btn"
              :class="{ 'copied': copiedPostIndex === platforms.indexOf(platform) }"
              @click="copyPost(platform.post, $event)"
              :aria-label="copiedPostIndex === platforms.indexOf(platform) ? 'Copied' : 'Copy post'"
            >
              <svg v-if="copiedPostIndex === platforms.indexOf(platform)" class="spw-copy-icon" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" d="M4.5 12.75l6 6 9-13.5" />
              </svg>
              <svg v-else class="spw-copy-icon" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" d="M15.666 3.888A2.25 2.25 0 0013.5 2.25h-3c-1.03 0-1.9.693-2.166 1.638m7.332 0c.055.194.084.4.084.612v0a.75.75 0 01-.75.75H9a.75.75 0 01-.75-.75v0c0-.212.03-.418.084-.612m7.332 0c.646.049 1.288.11 1.927.184 1.1.128 1.907 1.077 1.907 2.185V19.5a2.25 2.25 0 01-2.25 2.25H6.75A2.25 2.25 0 014.5 19.5V6.257c0-1.108.806-2.057 1.907-2.185a48.208 48.208 0 011.927-.184" />
              </svg>
              <span>{{ copiedPostIndex === platforms.indexOf(platform) ? 'Copied!' : 'Copy' }}</span>
            </button>
          </div>
          <div class="spw-post-content">{{ platform.post }}</div>
        </div>
      </div>
    </div>

    <!-- Footer hint -->
    <div v-if="platforms && platforms.length > 0" class="spw-footer">
      <svg class="spw-footer-icon" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" />
      </svg>
      AI-generated recommendations based on your project details
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { container } from '../../../../infrastructure/bootstrap/container';
import { TYPES as ROOT_TYPES } from '../../../../infrastructure/bootstrap/types';
import type { HttpClientPort } from '../../../../infrastructure/http/ports/http-client.port';
import { API_CONFIG } from '../../../../infrastructure/config/api.config';

interface Props {
  projectId: string;
}

interface SurveyPlatformSuggestion {
  platform: string;
  subplatform?: string;
  reason: string;
  postingStrategy: string;
  expectedReach: string;
  post: string;
}

interface ApiResponse {
  platforms: SurveyPlatformSuggestion[];
}

const props = defineProps<Props>();

const httpClient = container.get<HttpClientPort>(ROOT_TYPES.HttpClient);
const loading = ref(false);
const error = ref<string | null>(null);
const platforms = ref<SurveyPlatformSuggestion[]>([]);
const copiedPostIndex = ref<number | null>(null);

async function generatePlatforms(): Promise<void> {
  if (!props.projectId) return;

  loading.value = true;
  error.value = null;

  try {
    const data = await httpClient.post<ApiResponse>(
      API_CONFIG.ENDPOINTS.SUGGEST_PLATFORMS(props.projectId),
      {}
    );
    platforms.value = data.platforms;
  } catch (e) {
    const errorMessage = e instanceof Error ? e.message : 'Failed to generate platform suggestions';
    error.value = errorMessage;
    console.error('Failed to generate platform suggestions:', e);
  } finally {
    loading.value = false;
  }
}

function getPlatformUrl(platform: string, subplatform?: string): string {
  const platformLower = platform.toLowerCase();
  
  if (platformLower.includes('reddit')) {
    return 'https://www.reddit.com/';
  }
  
  if (platformLower.includes('hacker news')) {
    return 'https://news.ycombinator.com/';
  }
  
  if (platformLower.includes('indie hackers')) {
    return 'https://www.indiehackers.com/';
  }
  
  if (platformLower.includes('respondent')) {
    return 'https://www.respondent.io/';
  }
  
  if (platformLower.includes('prolific')) {
    return 'https://www.prolific.com/';
  }
  
  if (platformLower.includes('linkedin')) {
    return 'https://www.linkedin.com/';
  }
  
  if (platformLower.includes('discord')) {
    return 'https://discord.com/';
  }
  
  // Default: search on Google
  return `https://www.google.com/search?q=${encodeURIComponent(platform)}`;
}

function getSubplatformLinks(platform: string, subplatform: string): Array<{ text: string; url: string }> {
  const platformLower = platform.toLowerCase();
  const links: Array<{ text: string; url: string }> = [];
  
  if (platformLower.includes('reddit')) {
    // Extract all subreddit names from subplatform (e.g., "r/startups, r/indiehackers, r/webdev")
    // Match r/ followed by alphanumeric, underscores, or hyphens
    const subreddits = subplatform.match(/r\/[\w-]+/g);
    if (subreddits && subreddits.length > 0) {
      // Remove duplicates and create links
      const uniqueSubreddits = [...new Set(subreddits)];
      uniqueSubreddits.forEach(subreddit => {
        links.push({
          text: subreddit,
          url: `https://www.reddit.com/${subreddit}/`
        });
      });
    }
  } else if (platformLower.includes('linkedin')) {
    // For LinkedIn, try to extract group names or keep as is
    // LinkedIn groups are usually just text, not links, but we can try to parse
    const parts = subplatform.split(',').map(s => s.trim());
    parts.forEach(part => {
      links.push({
        text: part,
        url: `https://www.linkedin.com/search/results/groups/?keywords=${encodeURIComponent(part)}`
      });
    });
  } else if (platformLower.includes('discord')) {
    // For Discord, try to extract server/channel names
    const parts = subplatform.split(',').map(s => s.trim());
    parts.forEach(part => {
      links.push({
        text: part,
        url: `https://discord.com/search?q=${encodeURIComponent(part)}`
      });
    });
  } else {
    // For other platforms, try to split by comma and create search links
    const parts = subplatform.split(',').map(s => s.trim()).filter(s => s.length > 0);
    if (parts.length > 1) {
      parts.forEach(part => {
        links.push({
          text: part,
          url: `https://www.google.com/search?q=${encodeURIComponent(platform + ' ' + part)}`
        });
      });
    }
  }
  
  return links;
}

function getSubplatformUrl(platform: string, subplatform: string): string | null {
  const links = getSubplatformLinks(platform, subplatform);
  return links.length > 0 ? links[0].url : null;
}

function copyPost(post: string, event: Event): void {
  event.stopPropagation();
  navigator.clipboard.writeText(post).then(() => {
    const index = platforms.value.findIndex(p => p.post === post);
    copiedPostIndex.value = index;
    setTimeout(() => {
      copiedPostIndex.value = null;
    }, 2000);
  }).catch(err => {
    console.error('Failed to copy post:', err);
  });
}
</script>

<style scoped>
.survey-platforms-widget {
  border: 1px solid #e5e7eb;
  border-radius: 16px;
  background: #ffffff;
  overflow: hidden;
  box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px -1px rgba(0, 0, 0, 0.1);
}

.spw-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1.25rem 1.5rem;
  border-bottom: 1px solid #f3f4f6;
  background: linear-gradient(135deg, #fafafa 0%, #ffffff 100%);
}

.spw-header-left {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.spw-icon {
  width: 1.5rem;
  height: 1.5rem;
  color: #6366f1;
  flex-shrink: 0;
}

.spw-title {
  font-size: 1rem;
  font-weight: 700;
  color: #111827;
  margin: 0;
  letter-spacing: -0.01em;
}

.spw-subtitle {
  font-size: 0.8125rem;
  color: #6b7280;
  margin: 0.25rem 0 0;
  font-weight: 400;
}

.spw-generate-btn {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 0.8125rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  box-shadow: 0 2px 4px 0 rgba(99, 102, 241, 0.2);
  white-space: nowrap;
}

.spw-generate-btn:hover:not(:disabled) {
  background: linear-gradient(135deg, #5855eb 0%, #7c3aed 100%);
  box-shadow: 0 4px 6px -1px rgba(99, 102, 241, 0.3);
  transform: translateY(-1px);
}

.spw-generate-btn:active:not(:disabled) {
  transform: translateY(0);
  box-shadow: 0 1px 2px 0 rgba(99, 102, 241, 0.2);
}

.spw-generate-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none;
}

.spw-loading {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 1.5rem 1.25rem;
  color: #6b7280;
  font-size: 0.875rem;
}

.spw-loading-dots {
  display: flex;
  gap: 3px;
}

.spw-loading-dots span {
  width: 5px;
  height: 5px;
  border-radius: 50%;
  background: #6366f1;
  animation: spw-pulse 1.2s ease-in-out infinite;
}

.spw-loading-dots span:nth-child(2) { animation-delay: 0.2s; }
.spw-loading-dots span:nth-child(3) { animation-delay: 0.4s; }

@keyframes spw-pulse {
  0%, 80%, 100% { opacity: 0.3; transform: scale(0.8); }
  40% { opacity: 1; transform: scale(1); }
}

.spw-empty {
  padding: 3rem 1.5rem;
  text-align: center;
  color: #6b7280;
  font-size: 0.9375rem;
}

.spw-empty-icon {
  width: 3rem;
  height: 3rem;
  margin: 0 auto 1.25rem;
  color: #d1d5db;
  opacity: 0.6;
}

.spw-empty-hint {
  margin-top: 0.75rem;
  color: #9ca3af;
  font-size: 0.875rem;
  font-weight: 400;
}

.spw-platforms {
  padding: 0;
}

.spw-platform-card {
  border-bottom: 1px solid #f3f4f6;
  padding: 1.5rem;
  transition: all 0.2s ease;
  position: relative;
}

.spw-platform-card::before {
  content: '';
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  width: 3px;
  background: linear-gradient(180deg, #6366f1 0%, #8b5cf6 100%);
  opacity: 0;
  transition: opacity 0.2s ease;
}

.spw-platform-card:hover {
  background: linear-gradient(90deg, #fafafa 0%, #ffffff 100%);
  padding-left: 1.75rem;
}

.spw-platform-card:hover::before {
  opacity: 1;
}

.spw-platform-card:last-child {
  border-bottom: none;
}

.spw-platform-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 0.75rem;
  gap: 1rem;
  flex-wrap: wrap;
}

.spw-platform-main {
  flex: 1;
}

.spw-platform-name-row {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 0.5rem;
}

.spw-platform-icon-wrapper {
  width: 2.5rem;
  height: 2.5rem;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #eef2ff 0%, #e0e7ff 100%);
  border-radius: 10px;
  flex-shrink: 0;
}

.spw-platform-icon {
  width: 1.25rem;
  height: 1.25rem;
  color: #6366f1;
}

.spw-platform-title-group {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex-wrap: wrap;
  flex: 1;
}

.spw-platform-name {
  font-weight: 700;
  color: #111827;
  font-size: 1.0625rem;
  letter-spacing: -0.01em;
}

.spw-platform-link {
  color: #6366f1;
  text-decoration: none;
  transition: all 0.2s ease;
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
}

.spw-platform-link::after {
  content: '↗';
  font-size: 0.75rem;
  opacity: 0;
  transition: opacity 0.2s ease;
}

.spw-platform-link:hover {
  color: #5855eb;
  text-decoration: underline;
}

.spw-platform-link:hover::after {
  opacity: 1;
}

.spw-platform-sub {
  display: inline-block;
  background: linear-gradient(135deg, #e0e7ff 0%, #ddd6fe 100%);
  color: #3730a3;
  padding: 0.25rem 0.625rem;
  border-radius: 6px;
  font-size: 0.75rem;
  font-weight: 600;
  border: 1px solid rgba(99, 102, 241, 0.1);
  margin-right: 0.375rem;
  margin-bottom: 0.25rem;
}

.spw-platform-sub-link {
  display: inline-block;
  text-decoration: none;
  transition: all 0.2s ease;
  margin-right: 0.375rem;
  margin-bottom: 0.25rem;
}

.spw-platform-sub-link:hover {
  background: linear-gradient(135deg, #c7d2fe 0%, #c4b5fd 100%);
  color: #312e81;
  transform: translateY(-1px);
  box-shadow: 0 2px 4px rgba(99, 102, 241, 0.2);
}

.spw-platform-meta {
  margin-top: 0.5rem;
}

.spw-platform-reach-badge {
  display: inline-flex;
  align-items: center;
  gap: 0.375rem;
  background: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%);
  color: #166534;
  padding: 0.375rem 0.75rem;
  border-radius: 8px;
  font-size: 0.8125rem;
  font-weight: 600;
  border: 1px solid rgba(34, 197, 94, 0.2);
}

.spw-reach-icon {
  width: 0.875rem;
  height: 0.875rem;
  flex-shrink: 0;
}

.spw-platform-strategy {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
  color: #92400e;
  padding: 0.625rem 1rem;
  border-radius: 10px;
  font-size: 0.8125rem;
  font-weight: 600;
  border: 1px solid rgba(251, 191, 36, 0.3);
  max-width: 320px;
  white-space: normal;
  flex-shrink: 0;
}

.spw-platform-strategy span {
  display: inline;
  line-height: 1.4;
  word-wrap: break-word;
  overflow-wrap: break-word;
}

.spw-strategy-icon {
  width: 1rem;
  height: 1rem;
  flex-shrink: 0;
}

.spw-platform-reason {
  display: flex;
  align-items: flex-start;
  gap: 0.5rem;
  color: #4b5563;
  font-size: 0.875rem;
  line-height: 1.6;
  margin: 1rem 0;
  padding: 0.75rem;
  background: #f9fafb;
  border-radius: 8px;
  border-left: 3px solid #e5e7eb;
}

.spw-reason-icon {
  width: 1rem;
  height: 1rem;
  color: #6366f1;
  flex-shrink: 0;
  margin-top: 0.125rem;
}

.spw-platform-reason p {
  margin: 0;
  flex: 1;
}

.spw-platform-post {
  margin-top: 1.25rem;
  padding-top: 1.25rem;
  border-top: 2px solid #f3f4f6;
}

.spw-post-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 0.875rem;
  gap: 0.75rem;
}

.spw-post-label-wrapper {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.spw-post-label-icon {
  width: 1rem;
  height: 1rem;
  color: #6366f1;
  flex-shrink: 0;
}

.spw-post-label {
  font-size: 0.8125rem;
  font-weight: 700;
  color: #374151;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.spw-copy-btn {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  background: linear-gradient(135deg, #f3f4f6 0%, #e5e7eb 100%);
  border: 1px solid #d1d5db;
  border-radius: 8px;
  font-size: 0.8125rem;
  font-weight: 600;
  color: #374151;
  cursor: pointer;
  transition: all 0.2s ease;
  box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
}

.spw-copy-btn:hover {
  background: linear-gradient(135deg, #e5e7eb 0%, #d1d5db 100%);
  border-color: #9ca3af;
  transform: translateY(-1px);
  box-shadow: 0 2px 4px 0 rgba(0, 0, 0, 0.1);
}

.spw-copy-btn:active {
  transform: translateY(0);
}

.spw-copy-btn.copied {
  background: linear-gradient(135deg, #dcfce7 0%, #bbf7d0 100%);
  border-color: #86efac;
  color: #166534;
}

.spw-copy-icon {
  width: 1rem;
  height: 1rem;
  flex-shrink: 0;
}

.spw-post-content {
  background: linear-gradient(135deg, #ffffff 0%, #f9fafb 100%);
  border: 2px solid #e5e7eb;
  border-radius: 12px;
  padding: 1.25rem;
  color: #111827;
  font-size: 0.9375rem;
  line-height: 1.7;
  white-space: pre-wrap;
  word-wrap: break-word;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
  box-shadow: inset 0 2px 4px 0 rgba(0, 0, 0, 0.02);
  transition: all 0.2s ease;
}

.spw-post-content:hover {
  border-color: #d1d5db;
  box-shadow: inset 0 2px 4px 0 rgba(0, 0, 0, 0.04);
}

.spw-footer {
  display: flex;
  align-items: center;
  gap: 0.625rem;
  padding: 1rem 1.5rem;
  background: linear-gradient(135deg, #fafafa 0%, #f3f4f6 100%);
  border-top: 1px solid #e5e7eb;
  color: #6b7280;
  font-size: 0.8125rem;
  font-weight: 500;
}

.spw-footer-icon {
  width: 1.125rem;
  height: 1.125rem;
  color: #6366f1;
  flex-shrink: 0;
}

/* Responsive adjustments */
@media (max-width: 768px) {
  .survey-platforms-widget {
    border-radius: 12px;
  }

  .spw-header {
    flex-direction: column;
    gap: 1rem;
    align-items: flex-start;
    padding: 1rem 1.25rem;
  }

  .spw-generate-btn {
    align-self: stretch;
    justify-content: center;
  }

  .spw-platform-card {
    padding: 1.25rem;
  }

  .spw-platform-card:hover {
    padding-left: 1.25rem;
  }

  .spw-platform-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 1rem;
  }

  .spw-platform-strategy {
    white-space: normal;
    align-self: stretch;
    max-width: 100%;
  }

  .spw-platform-name-row {
    flex-wrap: wrap;
  }

  .spw-post-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.75rem;
  }

  .spw-copy-btn {
    align-self: stretch;
    justify-content: center;
  }
}
</style>