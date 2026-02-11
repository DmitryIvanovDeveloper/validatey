<template>
  <div class="project-details-view">
    <header v-if="project && !isEmbeddedInDashboard" class="page-header">
      <nav class="breadcrumb" aria-label="Breadcrumb">
        <router-link to="/projects" class="breadcrumb-link">Projects</router-link>
        <span class="breadcrumb-sep">/</span>
        <span class="breadcrumb-current">{{ project.name }}</span>
      </nav>
      <div class="header-main">
        <h1 class="page-title">{{ project.name }}</h1>
        <div class="header-actions">
          <router-link :to="`/projects/${projectId}/invitations`" class="btn btn-secondary">Manage Invitations</router-link>
          <router-link :to="`/projects/${projectId}`" class="btn btn-secondary">Overview</router-link>
          <router-link :to="`/projects/${projectId}/research`" class="btn btn-secondary">Research</router-link>
          <router-link :to="`/projects/${projectId}/report`" class="btn btn-primary">Report</router-link>
        </div>
      </div>
    </header>

    <div v-if="viewModel.loading.value" class="loading-state">
      <LoadingSpinner />
      <p>Loading project...</p>
    </div>

    <div v-else-if="viewModel.error.value" class="error-state">
      <ErrorDisplay :error="viewModel.error.value" />
    </div>

    <div v-else-if="project" class="overview-container">
      <div class="overview-grid">
        <!-- Main Content -->
        <div class="overview-main">
          <!-- Executive Summary -->
          <div class="overview-card">
            <h2 class="card-title">Executive Summary</h2>

            <!-- AI Verdict -->
            <div v-if="overviewData?.executiveSummary?.aiVerdict" class="ai-verdict-card" :class="getVerdictClass(overviewData.executiveSummary.aiVerdict)">
              <div class="verdict-icon">
                <svg v-if="isPositiveVerdict(overviewData.executiveSummary.aiVerdict)" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
                  <polyline points="22,4 12,14.01 9,11.01"/>
                </svg>
                <svg v-else viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <circle cx="12" cy="12" r="10"/>
                  <line x1="15" y1="9" x2="9" y2="15"/>
                  <line x1="9" y1="9" x2="15" y2="15"/>
                </svg>
              </div>
              <div class="verdict-content">
                <div class="verdict-title">
                  AI Verdict: {{ getVerdictLabel(overviewData.executiveSummary.aiVerdict) }}
                </div>
                <div class="verdict-description">
                  {{ getVerdictDescription(overviewData.executiveSummary.aiVerdict) }}
                </div>
              </div>
            </div>

            <!-- Key Metrics -->
            <div class="metrics-grid">
              <div class="metric-card">
                <div class="metric-label">Response Rate</div>
                <div class="metric-value">{{ overviewData?.executiveSummary?.responseRatePct ?? 0 }}%</div>
              </div>
              <div class="metric-card">
                <div class="metric-label">Total Responses</div>
                <div class="metric-value">{{ overviewData?.executiveSummary?.responded ?? 0 }}/{{ overviewData?.executiveSummary?.sent ?? 0 }}</div>
              </div>
              <div class="metric-card">
                <div class="metric-label">Daily Pace</div>
                <div class="metric-value">{{ overviewData?.executiveSummary?.paceResponsesPerDay ?? 0 }}/day</div>
              </div>
              <div class="metric-card">
                <div class="metric-label">Status</div>
                <div class="metric-value">{{ getStatusLabel((overviewData?.executiveSummary?.status ?? project.status) as ProjectStatus) }}</div>
              </div>
            </div>

            <!-- Key Insights -->
            <div v-if="overviewData?.executiveSummary?.keyInsight" class="key-insight">
              <div class="insight-icon">💡</div>
              <div class="insight-text">{{ overviewData.executiveSummary.keyInsight }}</div>
            </div>

            <!-- Significance Alert -->
            <div v-if="overviewData?.executiveSummary?.neededForSignificance && overviewData.executiveSummary.neededForSignificance > 0" class="significance-alert">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="12" cy="12" r="10"/>
                <line x1="12" y1="8" x2="12" y2="12"/>
                <line x1="12" y1="16" x2="12.01" y2="16"/>
              </svg>
              <span>Need {{ overviewData.executiveSummary.neededForSignificance }} more responses for statistical significance</span>
            </div>
          </div>

          <!-- Project Pulse -->
          <div class="overview-card">
            <h2 class="card-title">Project Pulse</h2>
            <div class="pulse-grid">
              <template v-if="overviewData?.pulse?.length">
                <div
                  v-for="metric in overviewData.pulse"
                  :key="metric.id"
                  class="pulse-card"
                  :class="`pulse-${metric.status}`"
                >
                  <div class="pulse-icon">
                    <svg v-if="metric.id === 'pace'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <polyline points="23,4 23,10 17,10"/>
                      <path d="M20.49,15A9,9,0,1,1,5.64,5.64L23,10"/>
                    </svg>
                    <svg v-else-if="metric.id === 'richness'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <path d="M14,2H6a2,2,0,0,0-2,2V22a2,2,0,0,0,2,2H18a2,2,0,0,0,2-2V8Z"/>
                      <polyline points="14,2 14,8 20,8"/>
                      <line x1="16" y1="13" x2="8" y2="13"/>
                      <line x1="16" y1="17" x2="8" y2="17"/>
                      <polyline points="10,9 9,9 8,9"/>
                    </svg>
                    <svg v-else-if="metric.id === 'coverage'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <path d="M12,1a9,9,0,0,0-9,9c0,5.5,9,13,9,13s9-7.5,9-13A9,9,0,0,0,12,1Z"/>
                      <circle cx="12" cy="10" r="3"/>
                    </svg>
                    <svg v-else viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <circle cx="12" cy="12" r="10"/>
                      <polyline points="12,6 12,12 16,14"/>
                    </svg>
                  </div>
                  <div class="pulse-content">
                    <div class="pulse-label">{{ metric.label }}</div>
                    <div class="pulse-value">{{ metric.value }}</div>
                    <div class="pulse-detail">{{ metric.detail }}</div>
                  </div>
                </div>
              </template>
            </div>
          </div>

          <!-- Research Context -->
          <div v-if="overviewData?.researchContext?.hasData" class="overview-card">
            <h2 class="card-title">Research Context</h2>
            <div class="research-content">
              <div v-if="overviewData.researchContext.summary" class="research-section">
                <div class="research-label">Summary</div>
                <div class="research-text">{{ overviewData.researchContext.summary }}</div>
              </div>
              <div v-if="overviewData.researchContext.marketSnippet" class="research-section">
                <div class="research-label">Market</div>
                <div class="research-text">{{ overviewData.researchContext.marketSnippet }}</div>
              </div>
              <div v-if="overviewData.researchContext.competitorsSnippet" class="research-section">
                <div class="research-label">Competitors</div>
                <div class="research-text">{{ overviewData.researchContext.competitorsSnippet }}</div>
              </div>
              <router-link :to="`/projects/${projectId}/research`" class="research-link">
                More in Research →
              </router-link>
            </div>
          </div>

          <!-- Learning Journey -->
          <div class="overview-card">
            <h2 class="card-title">Learning Journey</h2>
            <div v-if="overviewData?.learningJourney?.rounds?.length" class="journey-timeline">
              <div
                v-for="(round, idx) in overviewData.learningJourney.rounds"
                :key="round.id"
                class="journey-step"
              >
                <div v-if="idx > 0" class="journey-connector"></div>
                <div class="journey-node" :class="`journey-${round.status}`">
                  <div class="journey-type">{{ roundTypeLabel(round.type) }}</div>
                  <div class="journey-title">{{ round.title }}</div>
                  <div v-if="round.keyFinding" class="journey-finding">{{ round.keyFinding }}</div>
                  <router-link :to="round.reportHref" class="journey-link">Report</router-link>
                </div>
              </div>
            </div>
            <div v-else class="journey-empty">
              <p>No validation rounds yet. Start your first round to begin the learning journey.</p>
              <button type="button" class="btn btn-primary" @click="openCreateRoundModal">
                Create Round
              </button>
            </div>
          </div>

          <!-- Decision Pathway -->
          <div class="overview-card">
            <h2 class="card-title">Decision Pathway</h2>
            <template v-if="overviewData?.decisionPathway">
              <div class="decision-steps">
                <div
                  v-for="step in overviewData.decisionPathway.steps"
                  :key="step.id"
                  class="decision-step"
                  :class="{ 'step-completed': step.status === 'done', 'step-active': step.status === 'in_progress' }"
                >
                  <div class="step-indicator">
                    <svg v-if="step.status === 'done'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
                      <polyline points="22,4 12,14.01 9,11.01"/>
                    </svg>
                  </div>
                  <div class="step-content">
                    <div class="step-label">{{ step.label }}</div>
                    <div class="step-progress">{{ step.progress }}</div>
                    <router-link v-if="step.actionHref" :to="step.actionHref" class="step-action">Go</router-link>
                  </div>
                </div>
              </div>

              <div class="success-criteria">
                <h3 class="criteria-title">Success Criteria</h3>
                <div class="criteria-list">
                  <div
                    v-for="criterion in overviewData.decisionPathway.successCriteria"
                    :key="criterion.label"
                    class="criterion-item"
                    :class="{ 'criterion-met': criterion.met }"
                  >
                    <div class="criterion-check">
                      <svg v-if="criterion.met" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <polyline points="20,6 9,17 4,12"/>
                      </svg>
                    </div>
                    <div class="criterion-content">
                      <div class="criterion-label">{{ criterion.label }}</div>
                      <div class="criterion-value">{{ criterion.current }} (target: {{ criterion.target }})</div>
                    </div>
                  </div>
                </div>
              </div>
            </template>
          </div>
        </div>

        <!-- Sidebar -->
        <div class="overview-sidebar">
          <!-- Smart Actions -->
          <div class="sidebar-card">
            <h3 class="sidebar-title">Smart Actions</h3>
            <div class="smart-actions-list">
              <template v-if="overviewData?.smartActions?.length">
                <router-link
                  v-for="action in overviewData.smartActions"
                  :key="action.id"
                  :to="action.href"
                  class="smart-action-item"
                >
                  <div class="action-icon">
                    <svg v-if="action.id === 'reminders'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <path d="M22,4 22,10 17,10"/>
                      <path d="M20.49,15A9,9,0,1,1,5.64,5.64L23,10"/>
                    </svg>
                    <svg v-else-if="action.id === 'share'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <path d="M10,13A5,5,0,0,0,2,13V11A5,5,0,0,1,10,6h8"/>
                      <polyline points="14,2 20,2 20,8"/>
                      <line x1="20" y1="2" x2="10" y2="12"/>
                    </svg>
                    <svg v-else viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <path d="M14.7,6.3a1,1,0,0,0,0,1.4l1.6,1.6a1,1,0,0,0,1.4,0L21,8"/>
                      <path d="M17,21H3a2,2,0,0,1-2-2V5a2,2,0,0,1,2-2H9"/>
                      <line x1="9" y1="9" x2="4" y2="4"/>
                      <polyline points="9,9 9,21 13,21"/>
                    </svg>
                  </div>
                  <div class="action-content">
                    <div class="action-label">{{ action.label }}</div>
                    <div class="action-hint">{{ action.hint }}</div>
                  </div>
                </router-link>
              </template>
              <template v-else>
                <router-link :to="`/projects/${projectId}/invitations`" class="smart-action-item">
                  <div class="action-icon">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <path d="M22,4 22,10 17,10"/>
                      <path d="M20.49,15A9,9,0,1,1,5.64,5.64L23,10"/>
                    </svg>
                  </div>
                  <div class="action-content">
                    <div class="action-label">Send reminders</div>
                    <div class="action-hint">Invitations</div>
                  </div>
                </router-link>
                <router-link :to="`/projects/${projectId}/report`" class="smart-action-item">
                  <div class="action-icon">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <path d="M14,2H6a2,2,0,0,0-2,2V22a2,2,0,0,0,2,2H18a2,2,0,0,0,2-2V8Z"/>
                      <polyline points="14,2 14,8 20,8"/>
                    </svg>
                  </div>
                  <div class="action-content">
                    <div class="action-label">View report</div>
                    <div class="action-hint">Results</div>
                  </div>
                </router-link>
              </template>
            </div>
          </div>

          <!-- Quick Stats -->
          <div class="sidebar-card">
            <h3 class="sidebar-title">Quick Stats</h3>
            <div class="stats-list">
              <div class="stat-item">
                <span class="stat-label">Responses</span>
                <span class="stat-value">{{ overviewStats.responded }}/{{ overviewStats.sent }}</span>
              </div>
              <div class="stat-item">
                <span class="stat-label">Response Rate</span>
                <span class="stat-value">{{ overviewResponseRate }}%</span>
              </div>
              <div class="stat-item">
                <span class="stat-label">Project Age</span>
                <span class="stat-value">{{ getProjectAge() }} days</span>
              </div>
              <div class="stat-item">
                <span class="stat-label">Status</span>
                <span class="stat-value">{{ getStatusLabel(project.status as ProjectStatus) }}</span>
              </div>
            </div>
          </div>

          <!-- Project Details -->
          <div class="sidebar-card">
            <h3 class="sidebar-title">Project Details</h3>
            <div class="project-meta">
              <div class="meta-item">
                <span class="meta-label">Created</span>
                <span class="meta-value">{{ formatDate(project.createdAt) }}</span>
              </div>
              <div class="meta-item">
                <span class="meta-label">Last Updated</span>
                <span class="meta-value">{{ formatDate(project.updatedAt) }}</span>
              </div>
            </div>
            <router-link :to="`/projects/${projectId}/edit`" class="edit-link">
              Edit Project
            </router-link>
          </div>
        </div>
      </div>
    </div>


      <!-- 5. PROJECT DETAILS (collapsed by default feel: compact) -->
      <section class="overview-details">
        <h3 class="section-label">Project details</h3>
        <p v-if="saveError" class="form-error">{{ saveError }}</p>

        <Card class="detail-card segment-card" id="segment">
          <template #header>
            <div class="card-header-row">
              <h4 class="card-title">Segment & demographics</h4>
              <button v-if="!editingSegment" type="button" class="btn-edit" @click="startEditSegment">Edit</button>
              <template v-else>
                <button type="button" class="btn-save" :disabled="savingSegment" @click="saveSegment">{{ savingSegment ? 'Saving…' : 'Save' }}</button>
                <button type="button" class="btn-cancel" :disabled="savingSegment" @click="cancelEditSegment">Cancel</button>
              </template>
            </div>
          </template>
          <template v-if="!editingSegment">
            <p class="formatted-text">{{ segmentDisplayText }}</p>
            <p v-if="demographicsDisplayText" class="demographics-inline">{{ demographicsDisplayText }}</p>
          </template>
          <template v-else>
            <label class="inline-label">Segment description</label>
            <textarea v-model="editSegmentDescription" class="overview-input overview-textarea" rows="2" placeholder="Describe your target segment" />
            <label class="inline-label">Demographics</label>
            <textarea v-model="editSegmentDemographics" class="overview-input overview-textarea" rows="1" placeholder="e.g. B2B, 25-45 or JSON" />
          </template>
        </Card>

        <Card class="detail-card market-context-card">
          <template #header>
            <div class="card-header-row">
              <span class="card-title" @click="marketContextCollapsed = !marketContextCollapsed" style="cursor:pointer; user-select:none;">Market context {{ marketContextCollapsed ? '▼' : '▲' }}</span>
              <template v-if="!marketContextCollapsed">
                <button v-if="!editingMarket" type="button" class="btn-edit" @click="startEditMarket">Edit</button>
                <template v-else>
                  <button type="button" class="btn-save" :disabled="savingMarket" @click="saveMarketContext">{{ savingMarket ? 'Saving…' : 'Save' }}</button>
                  <button type="button" class="btn-cancel" :disabled="savingMarket" @click="cancelEditMarket">Cancel</button>
                </template>
              </template>
            </div>
          </template>
          <div v-show="!marketContextCollapsed" class="market-context-inner">
            <template v-if="!editingMarket">
              <p v-if="marketDisplayText" class="formatted-text">{{ marketDisplayText }}</p>
              <p v-else class="formatted-text text-muted">Not specified</p>
            </template>
            <template v-else>
              <label class="inline-label">Market picture</label>
              <textarea v-model="editMarketPicture" class="overview-input overview-textarea" rows="1" placeholder="Brief market overview" />
              <label class="inline-label">Market fit</label>
              <textarea v-model="editMarketFit" class="overview-input overview-textarea" rows="1" placeholder="How your solution fits" />
              <label class="inline-label">Differentiation</label>
              <textarea v-model="editDifferentiation" class="overview-input overview-textarea" rows="1" placeholder="What makes you different" />
            </template>
          </div>
        </Card>

        <Card class="detail-card hypothesis-card" id="hypothesis">
          <template #header>
            <div class="card-header-row">
              <h4 class="card-title">Hypothesis</h4>
              <button v-if="!editingHypothesis" type="button" class="btn-edit" @click="startEditHypothesis">Edit</button>
              <template v-else>
                <button type="button" class="btn-save" :disabled="savingHypothesis" @click="saveHypothesis">{{ savingHypothesis ? 'Saving…' : 'Save' }}</button>
                <button type="button" class="btn-cancel" :disabled="savingHypothesis" @click="cancelEditHypothesis">Cancel</button>
              </template>
            </div>
          </template>
          <template v-if="!editingHypothesis">
            <p class="formatted-text">{{ hypothesisDisplayText }}</p>
            <p v-if="assumptionsDisplayText" class="assumptions-compact" :title="assumptionsDisplayText">{{ assumptionsDisplayText }}</p>
          </template>
          <template v-else>
            <label class="inline-label">Hypothesis description</label>
            <textarea v-model="editHypothesisDescription" class="overview-input overview-textarea" rows="2" placeholder="What are we validating?" />
            <label class="inline-label">Assumptions (one per line)</label>
            <textarea v-model="editAssumptionsText" class="overview-input overview-textarea" rows="2" placeholder="One assumption per line" />
          </template>
        </Card>

        <Card class="detail-card scenario-card" id="scenario">
          <template #header>
            <div class="card-header-row">
              <h4 class="card-title">Scenario</h4>
              <router-link v-if="scenarioContent" :to="`/projects/${projectId}/report`" class="edit-link">View questions</router-link>
              <router-link v-else :to="`/projects/${projectId}/edit`" class="edit-link">Edit</router-link>
            </div>
          </template>
          <template v-if="scenarioLoading">
            <p class="scenario-loading">Loading scenario...</p>
          </template>
          <template v-else-if="scenarioContent">
            <p class="scenario-summary">{{ scenarioQuestionCount }} questions · ~{{ scenarioEstimateMin }} min</p>
            <details class="scenario-details-toggle">
              <summary>Show full scenario</summary>
              <ScenarioViewer :content="scenarioContent" class="scenario-viewer-embed" />
            </details>
          </template>
          <template v-else-if="scenarioError">
            <p class="scenario-error">{{ scenarioError }}</p>
          </template>
          <template v-else>
            <p class="scenario-empty">No scenario yet. Create via the wizard.</p>
          </template>
        </Card>

        <Card class="detail-card audience-card">
          <template #header>
            <div class="card-header-row">
              <h4 class="card-title">Audience</h4>
              <router-link :to="`/projects/${projectId}/invitations`" class="edit-link">Manage</router-link>
            </div>
          </template>
          <p class="audience-stats">{{ overviewStats.sent }} sent · {{ overviewStats.responded }} responded</p>
          <router-link :to="`/projects/${projectId}/invitations`" class="btn btn-secondary btn-sm">Manage invitations</router-link>
        </Card>
      </section>

      <!-- 6. DECISION PATHWAY (path to solution) -->
      <section class="overview-decision-pathway card-elevated">
        <h3 class="section-label">Decision pathway</h3>
        <template v-if="overviewData?.decisionPathway">
          <div class="pathway-steps">
            <div
              v-for="s in overviewData.decisionPathway.steps"
              :key="s.id"
              :class="['pathway-step', `pathway-${s.status}`]"
            >
              <span class="pathway-step-label">{{ s.label }}</span>
              <span class="pathway-step-progress">{{ s.progress }}</span>
              <router-link v-if="s.actionHref" :to="s.actionHref" class="btn btn-ghost btn-sm">Go</router-link>
            </div>
          </div>
          <div class="pathway-criteria">
            <h4 class="pathway-criteria-title">Success criteria</h4>
            <ul class="pathway-criteria-list">
              <li
                v-for="(c, i) in overviewData.decisionPathway.successCriteria"
                :key="i"
                :class="{ 'criteria-met': c.met }"
              >
                {{ c.label }}: {{ c.current }} (target: {{ c.target }})
              </li>
            </ul>
          </div>
        </template>
        <template v-else>
          <ol class="next-steps-list">
            <li v-if="overviewStats.sent === 0">Send invitations to start collecting responses</li>
            <li v-else-if="overviewStats.responded === 0">Wait for responses or send reminders from Invitations</li>
            <li v-else>View the Report tab for validation results and recommendations</li>
            <li>Use Research Assistant for market and competitor insights</li>
          </ol>
        </template>
      </section>
    </div>

    <!-- Create round modal -->
    <Modal v-model="showCreateRoundModal" title="Add round" :closable="true">
      <p v-if="createRoundError" class="form-error">{{ createRoundError }}</p>
      <label class="inline-label">Title</label>
      <input v-model="createRoundTitle" type="text" class="overview-input" placeholder="e.g. Round 1: Quantitative Survey" />
      <label class="inline-label">Type</label>
      <select v-model="createRoundType" class="overview-input">
        <option value="survey">Survey</option>
        <option value="interview">Interview</option>
        <option value="ab_test">A/B test</option>
        <option value="field">Field study</option>
      </select>
      <label class="inline-label">Based on round (optional)</label>
      <select v-model="createRoundParentId" class="overview-input">
        <option value="">— None —</option>
        <option v-for="r in roundsList" :key="r.id" :value="r.id">{{ r.title }}</option>
      </select>
      <template #footer>
        <button type="button" class="btn btn-ghost" @click="closeCreateRoundModal">Cancel</button>
        <button type="button" class="btn btn-primary" :disabled="createRoundSaving || !createRoundTitle.trim()" @click="submitCreateRound">
          {{ createRoundSaving ? 'Creating…' : 'Create round' }}
        </button>
      </template>
    </Modal>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue';
import { useRoute } from 'vue-router';
import Card from '../../../../shared/components/Card.vue';
import LoadingSpinner from '../../../../shared/components/LoadingSpinner.vue';
import ErrorDisplay from '../../../../shared/components/ErrorDisplay.vue';
import ScenarioViewer from './components/ScenarioViewer.vue';
import Modal from '../../../../shared/components/Modal.vue';
import { API_CONFIG } from '../../../../infrastructure/config/api.config';
import { TYPES as ROOT_TYPES } from '../../../../infrastructure/bootstrap/types';
import type { HttpClientPort } from '../../../../infrastructure/http/ports/http-client.port';
import { ProjectViewModel } from '../view-models/project.view-model';
import { ProjectPresenter } from '../presenters/project.presenter';
import { container } from '../../../../infrastructure/bootstrap/container';
import { TYPES } from '../../infrastructure/bootstrap/types';
import { TYPES as SCENARIO_TYPES } from '../../../scenarios/infrastructure/bootstrap/types';
import { TYPES as INVITATION_TYPES } from '../../../invitations/infrastructure/bootstrap/types';
import type { ScenarioPresenter } from '../../../scenarios/interface-adapters/presenters/scenario.presenter';
import type { InvitationPresenter } from '../../../invitations/interface-adapters/presenters/invitation.presenter';
import { ProjectStatus } from '../../domain/entities/project.entity';

const route = useRoute();
const projectId = route.params.projectId as string;
const viewModel = new ProjectViewModel();
const presenter = container.get<ProjectPresenter>(TYPES.ProjectPresenter);
const scenarioPresenter = container.get<ScenarioPresenter>(SCENARIO_TYPES.ScenarioPresenter);
const invitationPresenter = container.get<InvitationPresenter>(INVITATION_TYPES.InvitationPresenter);
const httpClient = container.get<HttpClientPort>(ROOT_TYPES.HttpClient);

const scenarioContent = ref<string>('');
const scenarioId = ref<string | null>(null);
const scenarioLoading = ref(false);
const scenarioError = ref<string | null>(null);

const overviewInvitations = ref<Array<{ id: string; email: string; status: string }>>([]);
const marketContextCollapsed = ref(true);

const editSegmentDescription = ref('');
const editSegmentDemographics = ref('');
const editHypothesisDescription = ref('');
const editAssumptionsText = ref('');
const editMarketPicture = ref('');
const editMarketFit = ref('');
const editDifferentiation = ref('');
const savingSegment = ref(false);
const savingHypothesis = ref(false);
const savingMarket = ref(false);
const saveError = ref<string | null>(null);
const editingSegment = ref(false);
const editingHypothesis = ref(false);
const editingMarket = ref(false);

const showRecentResponsesModal = ref(false);
const recentResponsesLoading = ref(false);
const recentResponsesQuotes = ref<Array<{ text: string }>>([]);
const latestInsightText = ref('');

const roundsList = ref<Array<{
  id: string;
  projectId: string;
  parentRoundId: string | null;
  title: string;
  status: string;
  type: string;
  sortOrder: number;
  results: { keyFinding?: string; confidence?: number; nextQuestions?: string[] } | null;
  createdAt: string;
  updatedAt: string;
}>>([]);
const roundsLoading = ref(false);

/** Overview command center payload (executive summary, pulse, smart actions, research context, decision pathway). */
type OverviewPayload = {
  executiveSummary: {
    projectName: string;
    status: string;
    validationStatus: string;
    responded: number;
    sent: number;
    responseRatePct: number;
    neededForSignificance: number | null;
    keyInsight: string | null;
    deadline: string | null;
    daysRemaining: number | null;
    paceResponsesPerDay: number;
    aiVerdict: string | null;
    createdAt: string;
  };
  pulse: Array<{
    id: string;
    label: string;
    value: string;
    detail: string;
    status: string;
    actionLabel: string;
    actionHref: string;
  }>;
  smartActions: Array<{ id: string; label: string; hint: string; href: string }>;
  researchContext: { summary: string | null; marketSnippet: string | null; competitorsSnippet: string | null; hasData: boolean };
  learningJourney: { rounds: Array<{ id: string; title: string; type: string; status: string; keyFinding: string | null; reportHref: string }>; extendSuggestions: string[] };
  decisionPathway: {
    steps: Array<{ id: string; label: string; progress: string; status: string; actionHref: string | null }>;
    successCriteria: Array<{ label: string; current: string; target: string; met: boolean }>;
    decisionDate: string | null;
  };
};
const overviewData = ref<OverviewPayload | null>(null);
const overviewLoading = ref(false);
const overviewError = ref<string | null>(null);
const showCreateRoundModal = ref(false);
const createRoundTitle = ref('');
const createRoundType = ref<'survey' | 'interview' | 'ab_test' | 'field'>('survey');
const createRoundParentId = ref('');
const createRoundSaving = ref(false);
const createRoundError = ref<string | null>(null);

const project = computed(() => {
  return viewModel.project.value;
});

const segmentDisplayText = computed(() => {
  const d = project.value?.segment?.description?.trim();
  return d || 'Not specified';
});

const demographicsDisplayText = computed(() => {
  const p = project.value;
  if (!p?.segment?.demographics) return '';
  const d = p.segment.demographics;
  if (typeof d === 'string') return d;
  return Object.entries(d)
    .map(([k, v]) => `${k}: ${v}`)
    .join(' · ');
});

const hypothesisDisplayText = computed(() => {
  const d = project.value?.hypothesis?.description?.trim();
  return d || 'Not specified';
});

const assumptionsDisplayText = computed(() => {
  const a = project.value?.hypothesis?.assumptions;
  if (!Array.isArray(a) || a.length === 0) return '';
  return a.join(' · ');
});

const marketDisplayText = computed(() => {
  const mc = project.value?.marketContext;
  if (!mc) return '';
  const parts: string[] = [];
  if (mc.marketPicture?.trim()) parts.push(`Market: ${mc.marketPicture}`);
  if (mc.marketFit?.trim()) parts.push(`Fit: ${mc.marketFit}`);
  if (mc.differentiation?.trim()) parts.push(`Differentiation: ${mc.differentiation}`);
  return parts.join(' · ') || '';
});

const overviewStats = computed(() => {
  const list = overviewInvitations.value;
  const sent = list.filter((i) => i.status === 'sent' || i.status === 'responded' || i.status === 'completed').length;
  const responded = list.filter((i) => i.status === 'responded' || i.status === 'completed').length;
  return { total: list.length, sent, responded };
});
const overviewResponseRate = computed(() => {
  if (overviewStats.value.sent === 0) return 0;
  return Math.round((overviewStats.value.responded / overviewStats.value.sent) * 100);
});

const projectHealthScore = computed(() => {
  let score = 0;
  if (overviewStats.value.sent > 0) {
    score += Math.round(overviewResponseRate.value * 0.6);
  }
  if (scenarioContent.value?.trim()) score += 20;
  if (project.value?.hypothesis?.description?.trim() && project.value.hypothesis.description !== 'Not specified') score += 15;
  if (project.value?.segment?.description?.trim() && project.value.segment.description !== 'Not specified') score += 5;
  return Math.min(100, score);
});

const healthScoreClass = computed(() => {
  const s = projectHealthScore.value;
  if (s >= 60) return 'health-good';
  if (s >= 30) return 'health-warn';
  return 'health-low';
});

const scenarioQuestionCount = computed(() => {
  if (!scenarioContent.value?.trim()) return 0;
  try {
    const p = JSON.parse(scenarioContent.value) as { questions?: unknown[] };
    return Array.isArray(p.questions) ? p.questions.length : 0;
  } catch {
    return 0;
  }
});

const scenarioEstimateMin = computed(() => {
  const n = scenarioQuestionCount.value;
  return n <= 0 ? 0 : Math.max(2, Math.min(15, n * 1));
});

const isEmbeddedInDashboard = computed(() => route.matched.length > 1);

const hasMarketContext = computed(() => {
  const mc = project.value?.marketContext;
  if (!mc) return false;
  return !!(
    (mc.marketPicture && mc.marketPicture.trim()) ||
    (mc.marketFit && mc.marketFit.trim()) ||
    (mc.differentiation && mc.differentiation.trim())
  );
});

function getDemographicsText(p: NonNullable<typeof project.value>): string {
  const d = p.segment?.demographics;
  if (!d) return '';
  if (typeof d === 'string') return d;
  try {
    return JSON.stringify(d, null, 2);
  } catch {
    return Object.entries(d)
      .map(([k, v]) => `${k}: ${v}`)
      .join('\n');
  }
}

function syncEditFieldsFromProject() {
  const p = project.value;
  if (!p) return;
  editSegmentDescription.value = p.segment?.description ?? '';
  editSegmentDemographics.value = getDemographicsText(p);
  editHypothesisDescription.value = p.hypothesis?.description ?? '';
  editAssumptionsText.value = Array.isArray(p.hypothesis?.assumptions)
    ? p.hypothesis.assumptions.join('\n')
    : '';
  editMarketPicture.value = p.marketContext?.marketPicture ?? '';
  editMarketFit.value = p.marketContext?.marketFit ?? '';
  editDifferentiation.value = p.marketContext?.differentiation ?? '';
}

function startEditSegment() {
  syncEditFieldsFromProject();
  editingSegment.value = true;
  saveError.value = null;
}
function cancelEditSegment() {
  editingSegment.value = false;
}

function startEditHypothesis() {
  syncEditFieldsFromProject();
  editingHypothesis.value = true;
  saveError.value = null;
}
function cancelEditHypothesis() {
  editingHypothesis.value = false;
}

function startEditMarket() {
  syncEditFieldsFromProject();
  editingMarket.value = true;
  saveError.value = null;
}
function cancelEditMarket() {
  editingMarket.value = false;
}

async function saveSegment() {
  if (!projectId) return;
  savingSegment.value = true;
  saveError.value = null;
  const desc = editSegmentDescription.value.trim();
  let demographics: string | Record<string, unknown> = editSegmentDemographics.value.trim();
  if (demographics) {
    try {
      demographics = JSON.parse(demographics) as Record<string, unknown>;
    } catch {
      demographics = { text: editSegmentDemographics.value };
    }
  } else if (desc) {
    demographics = {};
  }
  const result = await presenter.updateProject(
    projectId,
    undefined,
    desc || undefined,
    demographics || undefined,
    undefined,
    undefined,
    undefined,
    undefined
  );
  savingSegment.value = false;
  if (result.ok) await presenter.loadProject(projectId, viewModel);
  else saveError.value = result.error ?? 'Failed to save';
}

async function saveHypothesis() {
  if (!projectId) return;
  savingHypothesis.value = true;
  saveError.value = null;
  const assumptions = editAssumptionsText.value
    .split('\n')
    .map((s) => s.trim())
    .filter(Boolean);
  const result = await presenter.updateProject(
    projectId,
    undefined,
    undefined,
    undefined,
    editHypothesisDescription.value.trim() || undefined,
    assumptions.length ? assumptions : undefined,
    undefined,
    undefined
  );
  savingHypothesis.value = false;
  if (result.ok) {
    editingHypothesis.value = false;
    await presenter.loadProject(projectId, viewModel);
  } else saveError.value = result.error ?? 'Failed to save';
}

async function saveMarketContext() {
  if (!projectId) return;
  savingMarket.value = true;
  saveError.value = null;
  const hasAny =
    editMarketPicture.value.trim() ||
    editMarketFit.value.trim() ||
    editDifferentiation.value.trim();
  const marketContext = hasAny
    ? {
        marketPicture: editMarketPicture.value.trim() || undefined,
        marketFit: editMarketFit.value.trim() || undefined,
        differentiation: editDifferentiation.value.trim() || undefined,
      }
    : null;
  const result = await presenter.updateProject(
    projectId,
    undefined,
    undefined,
    undefined,
    undefined,
    undefined,
    undefined,
    marketContext
  );
  savingMarket.value = false;
  if (result.ok) {
    editingMarket.value = false;
    await presenter.loadProject(projectId, viewModel);
  } else saveError.value = result.error ?? 'Failed to save';
}

const getStatusLabel = (status: ProjectStatus): string => {
  const labels: Record<string, string> = {
    draft: 'Draft',
    active: 'Active',
    'in-progress': 'In progress',
    completed: 'Completed',
    archived: 'Archived',
  };
  return labels[status] || status;
};

function validationStatusLabel(v: string): string {
  const map: Record<string, string> = {
    no_data: 'No data yet',
    weak_support: 'Weak support',
    unclear_signal: 'Unclear signal',
    validated: 'Validated',
  };
  return map[v] ?? v;
}

const formatDate = (date: Date | string): string => {
  if (!date) return '-';
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' });
};

const getProjectAge = (): number => {
  if (!project.value) return 0;
  const created = typeof project.value.createdAt === 'string'
    ? new Date(project.value.createdAt)
    : project.value.createdAt;
  const now = new Date();
  const diffTime = Math.abs(now.getTime() - created.getTime());
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};

const isPositiveVerdict = (verdict: string): boolean => {
  return verdict.toLowerCase().includes('go') || verdict.toLowerCase().includes('positive') ||
         verdict.toLowerCase().includes('validated') || verdict.toLowerCase().includes('confirmed');
};

const getVerdictClass = (verdict: string): string => {
  if (isPositiveVerdict(verdict)) {
    return 'verdict-positive';
  } else if (verdict.toLowerCase().includes('no-go') || verdict.toLowerCase().includes('negative')) {
    return 'verdict-negative';
  } else {
    return 'verdict-neutral';
  }
};

const getVerdictLabel = (verdict: string): string => {
  if (verdict.toLowerCase().includes('go')) return 'GO';
  if (verdict.toLowerCase().includes('no-go')) return 'NO-GO';
  if (verdict.toLowerCase().includes('unclear')) return 'UNCLEAR';
  return verdict;
};

const getVerdictDescription = (verdict: string): string => {
  if (isPositiveVerdict(verdict)) {
    return 'Hypothesis confirmed. Data shows strong interest and product-market fit.';
  } else if (verdict.toLowerCase().includes('no-go')) {
    return 'Hypothesis not confirmed. Insufficient interest or poor product-market fit.';
  } else {
    return 'Hypothesis validation inconclusive. Additional testing recommended.';
  }
};

async function loadScenario() {
  if (!projectId) return;
  scenarioLoading.value = true;
  scenarioError.value = null;
  scenarioContent.value = '';
  scenarioId.value = null;
  const result = await scenarioPresenter.getLatestByProjectId(projectId);
  scenarioLoading.value = false;
  if ('error' in result) {
    const isNotFound =
      result.error.includes('No scenario found') || result.error.includes('ScenarioNotFoundError');
    scenarioContent.value = '';
    scenarioError.value = isNotFound ? null : result.error;
  } else {
    scenarioContent.value = result.content;
    scenarioId.value = result.id;
    scenarioError.value = null;
  }
}

async function loadOverviewInvitations() {
  if (!projectId) return;
  const { invitations } = await invitationPresenter.loadInvitations(projectId);
  overviewInvitations.value = invitations;
}

async function loadRounds() {
  if (!projectId) return;
  roundsLoading.value = true;
  try {
    const url = API_CONFIG.ENDPOINTS.ROUNDS(projectId);
    const data = await httpClient.get<typeof roundsList.value>(url);
    roundsList.value = Array.isArray(data) ? data : [];
  } catch {
    roundsList.value = [];
  } finally {
    roundsLoading.value = false;
  }
}

async function loadOverview() {
  if (!projectId) return;
  overviewLoading.value = true;
  overviewError.value = null;
  try {
    const url = API_CONFIG.ENDPOINTS.OVERVIEW(projectId);
    const data = await httpClient.get<OverviewPayload>(url);
    overviewData.value = data ?? null;
  } catch {
    overviewData.value = null;
    overviewError.value = 'Overview unavailable';
  } finally {
    overviewLoading.value = false;
  }
}

function roundTypeLabel(type: string): string {
  const labels: Record<string, string> = {
    survey: 'Survey',
    interview: 'Interview',
    ab_test: 'A/B test',
    field: 'Field study',
  };
  return labels[type] ?? type;
}

function openCreateRoundModal() {
  createRoundTitle.value = '';
  createRoundType.value = 'survey';
  createRoundParentId.value = '';
  createRoundError.value = null;
  showCreateRoundModal.value = true;
}

function closeCreateRoundModal() {
  showCreateRoundModal.value = false;
}

async function submitCreateRound() {
  if (!projectId || !createRoundTitle.value.trim()) return;
  createRoundSaving.value = true;
  createRoundError.value = null;
  try {
    const url = API_CONFIG.ENDPOINTS.ROUNDS(projectId);
    const body: { title: string; type: string; parentRoundId?: string } = {
      title: createRoundTitle.value.trim(),
      type: createRoundType.value,
    };
    if (createRoundParentId.value.trim()) {
      body.parentRoundId = createRoundParentId.value.trim();
    }
    await httpClient.post(url, body);
    await loadRounds();
    closeCreateRoundModal();
  } catch (e) {
    createRoundError.value = e instanceof Error ? e.message : 'Failed to create round';
  } finally {
    createRoundSaving.value = false;
  }
}

onMounted(() => {
  if (projectId) {
    presenter.loadProject(projectId, viewModel);
  }
});

async function openRecentResponsesModal() {
  showRecentResponsesModal.value = true;
  recentResponsesQuotes.value = [];
  recentResponsesLoading.value = true;
  try {
    const url = API_CONFIG.ENDPOINTS.RESPONSES(projectId);
    const data = await httpClient.get<{ responses: Array<{ answers: Record<string, unknown>; transcript?: string }> }>(url);
    const list = data?.responses ?? [];
    const take = list.slice(0, 3);
    recentResponsesQuotes.value = take.map((r) => {
      const firstAnswer = Object.values(r.answers || {})[0];
      let text = '';
      if (firstAnswer != null) {
        text = typeof firstAnswer === 'string' ? firstAnswer : (typeof (firstAnswer as { text?: string }).text === 'string' ? (firstAnswer as { text: string }).text : JSON.stringify(firstAnswer));
      }
      if (!text && r.transcript) text = r.transcript.slice(0, 200) + (r.transcript.length > 200 ? '…' : '');
      if (!text) text = '—';
      return { text: text.slice(0, 200) + (text.length > 200 ? '…' : '') };
    });
  } catch {
    recentResponsesQuotes.value = [];
  } finally {
    recentResponsesLoading.value = false;
  }
}

watch(project, (p) => {
  if (p && projectId) {
    syncEditFieldsFromProject();
    loadScenario();
    loadOverviewInvitations();
    loadRounds();
    loadOverview();
  }
}, { immediate: true });

/** Scroll to Project details section when URL hash is #segment, #hypothesis, or #scenario. Edit form is not implemented yet. */
function scrollToHashSection() {
  const hash = route.hash?.replace(/^#/, '') || '';
  if (!hash || !['segment', 'hypothesis', 'scenario'].includes(hash)) return;
  requestAnimationFrame(() => {
    const el = document.getElementById(hash);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  });
}
watch(() => route.hash, scrollToHashSection, { immediate: true });
onMounted(() => scrollToHashSection());
</script>

<style scoped>
.project-details-view {
  padding: 2rem 0;
}

.page-header { margin-bottom: 2rem; }
.breadcrumb { display: flex; align-items: center; gap: 0.375rem; font-size: 0.8125rem; color: var(--color-text-muted, #64748b); margin-bottom: 0.5rem; }
.breadcrumb-link { color: var(--color-text-muted); text-decoration: none; }
.breadcrumb-link:hover { color: var(--color-accent); }
.breadcrumb-sep { opacity: 0.5; }
.breadcrumb-current { color: var(--color-text); font-weight: 600; }
.header-main { display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 1rem; }
.page-title { font-size: 1.5rem; font-weight: 700; color: var(--color-text); margin: 0; }
.header-actions { display: flex; gap: 0.5rem; flex-wrap: wrap; }

.btn-sm { padding: 0.5rem 1rem; font-size: 0.875rem; }

/* Overview redesign */
.overview-redesign {
  display: flex;
  flex-direction: column;
  gap: 2rem;
  background: linear-gradient(135deg, #f8fafc 0%, #ffffff 100%);
  min-height: 100vh;
  padding: 2rem 0;
  animation: fadeInUp 0.6s ease-out;
}

@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* Stagger animations for sections */
.overview-card:nth-child(1) { animation-delay: 0.1s; }
.overview-card:nth-child(2) { animation-delay: 0.2s; }
.overview-card:nth-child(3) { animation-delay: 0.3s; }
.overview-card:nth-child(4) { animation-delay: 0.4s; }
.sidebar-card:nth-child(1) { animation-delay: 0.2s; }
.sidebar-card:nth-child(2) { animation-delay: 0.3s; }
.sidebar-card:nth-child(3) { animation-delay: 0.4s; }

.overview-card,
.sidebar-card {
  animation: slideInUp 0.6s ease-out both;
}

/* New Overview Design Styles */

.overview-container {
.section-label {
  font-size: 0.8125rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: #64748b;
  margin: 0 0 1rem 0;
  position: relative;
}
.section-label::after {
  content: '';
  position: absolute;
  bottom: -0.25rem;
  left: 0;
  width: 2rem;
  height: 2px;
  background: linear-gradient(90deg, #0d9488, #0891b2);
  border-radius: 1px;
}

.overview-response-progress { margin-bottom: 0; }
.response-progress-card {
  background: var(--color-bg);
  border: 1px solid var(--color-border-light);
  border-radius: var(--radius-md);
  padding: 1rem 1.25rem;
}
.response-progress-stats { font-weight: 600; margin: 0 0 0.25rem 0; }
.response-progress-insight {
  font-size: 0.875rem;
  color: var(--color-text-muted);
  margin: 0 0 0.75rem 0;
}
.response-progress-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.overview-rounds { margin-bottom: 0; }
.rounds-intro { font-size: 0.875rem; color: var(--color-text-muted); margin: 0 0 0.75rem 0; }
.rounds-loading { padding: 1rem; color: var(--color-text-muted); }
.rounds-list { display: flex; flex-direction: column; gap: 0.75rem; margin-bottom: 1rem; }
.round-card {
  background: var(--color-bg);
  border: 1px solid var(--color-border-light);
  border-radius: var(--radius-md);
  padding: 1rem 1.25rem;
}
.round-status { font-size: 0.75rem; text-transform: uppercase; font-weight: 600; margin-right: 0.5rem; }
.round-status-draft { color: var(--color-text-muted); }
.round-status-active { color: var(--color-accent); }
.round-status-completed { color: var(--color-success, #38a169); }
.round-status-archived { color: var(--color-text-muted); }
.round-type { font-size: 0.75rem; color: var(--color-text-muted); }
.round-title { font-size: 1rem; font-weight: 600; margin: 0.25rem 0 0.5rem 0; }
.round-finding { font-size: 0.875rem; color: var(--color-text-muted); margin: 0 0 0.5rem 0; }
.round-actions { margin-top: 0.5rem; }
.rounds-empty { padding: 1rem; color: var(--color-text-muted); font-size: 0.875rem; }
.rounds-add-btn { margin-top: 0.25rem; }

.recent-loading, .recent-empty { padding: 1rem; color: var(--color-text-muted); }
.recent-quotes-list { list-style: none; padding: 0; margin: 0; }
.recent-quote {
  padding: 0.75rem 0;
  border-bottom: 1px solid var(--color-border-light);
}
.recent-quote:last-child { border-bottom: none; }
.recent-quote-label { font-size: 0.75rem; color: var(--color-text-muted); }
.recent-quote-text { margin: 0.25rem 0 0 0; font-size: 0.875rem; }
.card-elevated {
  background: rgba(255, 255, 255, 0.8);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 1rem;
  padding: 1.5rem 2rem;
  box-shadow:
    0 8px 32px rgba(0, 0, 0, 0.08),
    0 2px 8px rgba(0, 0, 0, 0.04);
  position: relative;
  overflow: hidden;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}
.card-elevated:hover {
  transform: translateY(-2px);
  box-shadow:
    0 16px 64px rgba(0, 0, 0, 0.12),
    0 8px 32px rgba(0, 0, 0, 0.08);
}
.card-elevated::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 3px;
  background: linear-gradient(90deg, #0d9488, #0891b2, #7c3aed);
  transition: all 0.3s ease;
}
.card-elevated:hover::before {
  height: 4px;
  box-shadow: 0 0 20px rgba(13, 148, 136, 0.3);
}
.overview-executive {
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(25px);
  border: 1px solid rgba(255, 255, 255, 0.3);
  border-radius: 1.25rem;
  padding: 2rem 2.5rem;
  box-shadow:
    0 20px 40px rgba(0, 0, 0, 0.1),
    0 8px 16px rgba(0, 0, 0, 0.06);
  position: relative;
  overflow: hidden;
}
.executive-validation-row {
  display: flex;
  gap: 2rem;
  align-items: flex-start;
}

.executive-left {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.executive-right {
  flex-shrink: 0;
}
.validation-status {
  font-size: 0.75rem;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  padding: 0.375rem 0.875rem;
  border-radius: 2rem;
  width: fit-content;
  position: relative;
  overflow: hidden;
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  transition: all 0.3s ease;
}
.validation-no_data {
  color: #64748b;
  background: linear-gradient(135deg, #f1f5f9, #e2e8f0);
  box-shadow: 0 4px 12px rgba(100, 116, 139, 0.15);
}
.validation-weak_support {
  color: #92400e;
  background: linear-gradient(135deg, #fef3c7, #fde68a);
  box-shadow: 0 4px 12px rgba(180, 83, 9, 0.15);
}
.validation-unclear_signal {
  color: #0f766e;
  background: linear-gradient(135deg, #ccfbf1, #99f6e4);
  box-shadow: 0 4px 12px rgba(13, 148, 136, 0.15);
}
.validation-validated {
  color: #166534;
  background: linear-gradient(135deg, #dcfce7, #bbf7d0);
  box-shadow: 0 4px 12px rgba(21, 128, 61, 0.15);
}
.executive-stats {
  font-size: 1rem;
  font-weight: 600;
  color: #374151;
  margin: 0;
  line-height: 1.5;
}
.executive-key-insight {
  font-size: 1rem;
  color: #1e293b;
  margin: 0.5rem 0;
  padding: 1rem 1.25rem;
  border-left: 4px solid linear-gradient(180deg, #0d9488, #0891b2);
  background: linear-gradient(135deg, rgba(13, 148, 136, 0.05), rgba(8, 145, 178, 0.05));
  border-radius: 0 0.75rem 0.75rem 0;
  position: relative;
  overflow: hidden;
}
.executive-key-insight::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  width: 4px;
  height: 100%;
  background: linear-gradient(180deg, #0d9488, #0891b2);
}
.executive-ai-verdict {
  font-size: 0.9375rem;
  color: #64748b;
  margin: 0.75rem 0 0 0;
  font-style: italic;
  line-height: 1.6;
  background: rgba(255, 255, 255, 0.6);
  backdrop-filter: blur(10px);
  padding: 1rem 1.25rem;
  border-radius: 0.75rem;
  border: 1px solid rgba(255, 255, 255, 0.2);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
}
.executive-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 1.5rem;
  flex-wrap: wrap;
  gap: 1rem;
}
.executive-title {
  font-size: 1.75rem;
  font-weight: 800;
  color: #1e293b;
  margin: 0;
  background: linear-gradient(135deg, #1e293b, #334155);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}
.executive-health-row {
  display: flex;
  align-items: flex-start;
  gap: 1.5rem;
  flex-wrap: wrap;
}

/* Modern Progress ring */
.overview-progress-ring {
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
  position: relative;
}
.overview-progress-ring .progress-ring {
  position: relative;
  width: 100px;
  height: 100px;
  border-radius: 50%;
  background:
    conic-gradient(
      #0d9488 calc(var(--p, 0) * 3.6deg),
      #e2e8f0 0
    ),
    linear-gradient(135deg, rgba(255, 255, 255, 0.1), rgba(255, 255, 255, 0.05));
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow:
    inset 0 0 0 8px rgba(255, 255, 255, 0.9),
    0 8px 32px rgba(13, 148, 136, 0.2),
    0 2px 8px rgba(13, 148, 136, 0.1);
  backdrop-filter: blur(10px);
  border: 2px solid rgba(255, 255, 255, 0.2);
  transition: all 0.4s ease;
}
.overview-progress-ring .progress-ring::before {
  content: '';
  position: absolute;
  inset: 12px;
  border-radius: 50%;
  background:
    radial-gradient(circle at 30% 30%, rgba(255, 255, 255, 0.8), rgba(255, 255, 255, 0.4)),
    linear-gradient(135deg, rgba(13, 148, 136, 0.1), rgba(8, 145, 178, 0.1));
  box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.1);
}
.overview-progress-ring .progress-value {
  font-size: 1.25rem;
  font-weight: 900;
  letter-spacing: -0.04em;
  color: #0d9488;
  position: relative;
  z-index: 1;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
  transition: color 0.3s ease;
}
.progress-ring-label {
  font-size: 0.75rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: #64748b;
  background: rgba(255, 255, 255, 0.8);
  backdrop-filter: blur(10px);
  padding: 0.25rem 0.5rem;
  border-radius: 1rem;
  border: 1px solid rgba(255, 255, 255, 0.2);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

.executive-metrics {
  flex: 1;
  min-width: 0;
}
.executive-insight {
  margin: 0 0 0.25rem 0;
  font-size: 0.9375rem;
  font-weight: 500;
  color: var(--color-text);
}
.executive-meta {
  margin: 0;
  font-size: 0.8125rem;
  color: var(--color-text-muted);
}
.overview-smart-actions { margin: 0; }
.smart-actions-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
  gap: 1rem;
}
.smart-action-btn {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  padding: 1.25rem 1.5rem;
  background: rgba(255, 255, 255, 0.8);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 1rem;
  text-decoration: none;
  color: #1e293b;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  overflow: hidden;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.06);
}
.smart-action-btn::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(13, 148, 136, 0.1), transparent);
  transition: left 0.5s ease;
}
.smart-action-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 32px rgba(13, 148, 136, 0.15);
  border-color: rgba(13, 148, 136, 0.3);
}
.smart-action-btn:hover::before {
  left: 100%;
}
.smart-action-label {
  font-size: 1rem;
  font-weight: 700;
  color: #1e293b;
  margin-bottom: 0.25rem;
  position: relative;
  z-index: 1;
}
.smart-action-hint {
  font-size: 0.8125rem;
  color: #64748b;
  margin: 0;
  position: relative;
  z-index: 1;
  opacity: 0.8;
}

.overview-pulse { margin: 0; }
.pulse-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 1.25rem;
}
.pulse-cell {
  background: rgba(255, 255, 255, 0.8);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 1rem;
  padding: 1.5rem 1.75rem;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  position: relative;
  overflow: hidden;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.06);
}
.pulse-cell::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  width: 4px;
  height: 100%;
  background: linear-gradient(180deg, #22c55e, #16a34a);
  transition: all 0.3s ease;
}
.pulse-cell.pulse-good {
  box-shadow: 0 4px 16px rgba(34, 197, 94, 0.1);
}
.pulse-cell.pulse-good::before {
  background: linear-gradient(180deg, #22c55e, #16a34a);
}
.pulse-cell.pulse-warn {
  box-shadow: 0 4px 16px rgba(234, 179, 8, 0.1);
}
.pulse-cell.pulse-warn::before {
  background: linear-gradient(180deg, #eab308, #ca8a04);
}
.pulse-cell.pulse-low {
  box-shadow: 0 4px 16px rgba(239, 68, 68, 0.1);
}
.pulse-cell.pulse-low::before {
  background: linear-gradient(180deg, #ef4444, #dc2626);
}
.pulse-cell:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.12);
}
.pulse-value {
  font-size: 1.375rem;
  font-weight: 800;
  color: #1e293b;
  line-height: 1.2;
}
.pulse-label {
  font-size: 0.8125rem;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: #64748b;
  font-weight: 700;
}
.pulse-detail {
  font-size: 0.875rem;
  color: #64748b;
  opacity: 0.9;
}
.pulse-action {
  font-size: 0.8125rem;
  font-weight: 700;
  color: #0d9488;
  text-decoration: none;
  margin-top: 0.5rem;
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  transition: all 0.2s ease;
  position: relative;
}
.pulse-action::after {
  content: '→';
  font-size: 0.875rem;
  transition: transform 0.2s ease;
}
.pulse-action:hover {
  color: #0891b2;
  transform: translateX(2px);
}
.pulse-action:hover::after {
  transform: translateX(2px);
}
.pulse-action.mute {
  color: #94a3b8;
  cursor: default;
}
.pulse-action.mute::after {
  display: none;
}

.overview-research-context {
  padding: 1.75rem 2rem;
  border-radius: 1rem;
  border: 1px solid rgba(139, 92, 246, 0.2);
  background:
    linear-gradient(135deg, rgba(139, 92, 246, 0.08) 0%, rgba(168, 85, 247, 0.04) 100%),
    rgba(255, 255, 255, 0.8);
  backdrop-filter: blur(20px);
  box-shadow: 0 8px 32px rgba(139, 92, 246, 0.1);
  position: relative;
  overflow: hidden;
}
.overview-research-context::before {
  content: '';
  position: absolute;
  top: -50%;
  right: -50%;
  width: 100%;
  height: 100%;
  background: radial-gradient(circle, rgba(139, 92, 246, 0.1) 0%, transparent 70%);
  pointer-events: none;
}
.research-summary {
  font-size: 1rem;
  margin: 0 0 0.75rem 0;
  color: #1e293b;
  font-weight: 500;
  line-height: 1.6;
  position: relative;
  z-index: 1;
}
.research-snippet {
  font-size: 0.875rem;
  color: #64748b;
  margin: 0.375rem 0 0 0;
  position: relative;
  z-index: 1;
}

.overview-learning-journey { margin: 0; }
.journey-chain {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-start;
  gap: 1rem 0;
  margin-bottom: 1.5rem;
  position: relative;
}
.journey-chain::before {
  content: '';
  position: absolute;
  top: 2rem;
  left: 0;
  right: 0;
  height: 2px;
  background: linear-gradient(90deg, #e2e8f0, #cbd5e1, #e2e8f0);
  z-index: 0;
}
.journey-step {
  display: flex;
  align-items: center;
  gap: 1rem;
  position: relative;
  z-index: 1;
}
.journey-arrow {
  color: #94a3b8;
  font-weight: 800;
  font-size: 1.125rem;
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(10px);
  border-radius: 50%;
  width: 2rem;
  height: 2rem;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
}
.journey-round {
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 1rem;
  padding: 1.5rem 1.75rem;
  min-width: 240px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.08);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}
.journey-round:hover {
  transform: translateY(-2px);
  box-shadow: 0 12px 40px rgba(0, 0, 0, 0.12);
}
.journey-status {
  font-size: 0.75rem;
  text-transform: uppercase;
  font-weight: 800;
  letter-spacing: 0.08em;
  margin-right: 0.75rem;
  padding: 0.25rem 0.5rem;
  border-radius: 0.5rem;
  display: inline-block;
}
.journey-status-draft {
  color: #94a3b8;
  background: rgba(148, 163, 184, 0.1);
}
.journey-status-active {
  color: #0891b2;
  background: rgba(8, 145, 178, 0.1);
  box-shadow: 0 0 8px rgba(8, 145, 178, 0.2);
}
.journey-status-completed {
  color: #166534;
  background: rgba(22, 163, 74, 0.1);
  box-shadow: 0 0 8px rgba(22, 163, 74, 0.2);
}
.journey-type {
  font-size: 0.8125rem;
  color: #64748b;
  font-weight: 500;
}
.journey-title {
  font-size: 1.125rem;
  font-weight: 700;
  margin: 0.5rem 0 0.75rem 0;
  color: #1e293b;
}
.journey-finding {
  font-size: 0.875rem;
  color: #64748b;
  margin: 0 0 0.75rem 0;
  line-height: 1.5;
}

.overview-decision-pathway {
  padding: 2rem 2.5rem;
  border-radius: 1rem;
  border: 1px solid rgba(255, 255, 255, 0.2);
  background: rgba(255, 255, 255, 0.8);
  backdrop-filter: blur(20px);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.08);
}
.pathway-steps {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  margin-bottom: 2rem;
}
.pathway-step {
  display: flex;
  align-items: center;
  gap: 1rem;
  flex-wrap: wrap;
  padding: 1rem 0;
  border-bottom: 1px solid rgba(0, 0, 0, 0.06);
  transition: all 0.3s ease;
  position: relative;
}
.pathway-step:last-of-type { border-bottom: none; }
.pathway-step:hover {
  background: rgba(13, 148, 136, 0.02);
  border-radius: 0.5rem;
  margin: 0 -0.5rem;
  padding: 1rem 0.5rem;
}
.pathway-step-label {
  font-weight: 700;
  flex: 1;
  min-width: 0;
  color: #1e293b;
  font-size: 1rem;
}
.pathway-step-progress {
  font-size: 0.875rem;
  color: #64748b;
  font-weight: 500;
  background: rgba(255, 255, 255, 0.8);
  backdrop-filter: blur(10px);
  padding: 0.25rem 0.5rem;
  border-radius: 0.5rem;
  border: 1px solid rgba(255, 255, 255, 0.2);
}
.pathway-done {
  color: #166534;
  background: rgba(34, 197, 94, 0.1);
  border-color: rgba(34, 197, 94, 0.2);
}
.pathway-criteria-title {
  font-size: 1rem;
  font-weight: 700;
  margin: 0 0 1rem 0;
  color: #1e293b;
  position: relative;
}
.pathway-criteria-title::after {
  content: '';
  position: absolute;
  bottom: -0.25rem;
  left: 0;
  width: 3rem;
  height: 2px;
  background: linear-gradient(90deg, #0d9488, #0891b2);
  border-radius: 1px;
}
.pathway-criteria-list {
  list-style: none;
  padding: 0;
  margin: 0;
  font-size: 0.875rem;
  display: grid;
  gap: 0.75rem;
}
.pathway-criteria-list li {
  padding: 0.75rem 1rem;
  background: rgba(255, 255, 255, 0.6);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 0.75rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
  transition: all 0.3s ease;
}
.pathway-criteria-list li:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);
}
.pathway-criteria-list .criteria-met {
  color: #166534;
  border-color: rgba(34, 197, 94, 0.3);
  background: rgba(34, 197, 94, 0.05);
}

.overview-health-metrics { margin: 0; }
.health-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1rem;
}
.health-cell {
  background: var(--color-bg);
  border: 1px solid var(--color-border-light);
  border-radius: var(--radius-md);
  padding: 1rem;
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}
.health-cell-value {
  font-size: 1.25rem;
  font-weight: 700;
  color: var(--color-text);
}
.health-cell-label {
  font-size: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.03em;
  color: var(--color-text-muted);
}
.health-cell-detail {
  font-size: 0.8125rem;
  color: var(--color-text-muted);
}
.health-cell-action {
  font-size: 0.8125rem;
  font-weight: 600;
  color: var(--color-accent);
  text-decoration: none;
  margin-top: 0.35rem;
}
.health-cell-action.mute {
  color: var(--color-text-subtle);
  cursor: default;
}
.health-cell-action:hover:not(.mute) {
  text-decoration: underline;
}
.overview-insights { margin: 0; }
.insights-placeholder {
  background: var(--color-bg);
  border: 1px dashed var(--color-border);
  border-radius: var(--radius-md);
  padding: 1rem 1.25rem;
}
.insights-placeholder p {
  margin: 0 0 0.5rem 0;
  font-size: 0.875rem;
  color: var(--color-text-muted);
}
.overview-details { margin: 0; }
.overview-details .detail-card {
  margin-bottom: 1.5rem;
  animation: slideInUp 0.6s ease-out both;
}
.overview-details .detail-card:nth-child(1) { animation-delay: 0.1s; }
.overview-details .detail-card:nth-child(2) { animation-delay: 0.2s; }
.overview-details .detail-card:nth-child(3) { animation-delay: 0.3s; }
.overview-details .detail-card:nth-child(4) { animation-delay: 0.4s; }
.overview-details .detail-card:last-child {
  margin-bottom: 0;
}
.edit-link {
  font-size: 0.8125rem;
  font-weight: 700;
  color: #0d9488;
  text-decoration: none;
  position: relative;
  transition: all 0.2s ease;
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
}
.edit-link::after {
  content: '';
  position: absolute;
  bottom: -2px;
  left: 0;
  width: 0;
  height: 2px;
  background: linear-gradient(90deg, #0d9488, #0891b2);
  transition: width 0.3s ease;
  border-radius: 1px;
}
.edit-link:hover {
  color: #0891b2;
  transform: translateY(-1px);
}
.edit-link:hover::after {
  width: 100%;
}
.btn-inline {
  background: none;
  border: none;
  padding: 0;
  cursor: pointer;
  font: inherit;
  color: inherit;
}
.btn-inline:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

/* Modern action buttons for detail cards */
.btn-edit,
.btn-save,
.btn-cancel {
  padding: 0.5rem 1rem;
  border-radius: 0.5rem;
  font-size: 0.8125rem;
  font-weight: 600;
  border: 1px solid rgba(255, 255, 255, 0.2);
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  overflow: hidden;
  backdrop-filter: blur(10px);
}

.btn-edit {
  background: rgba(13, 148, 136, 0.1);
  color: #0d9488;
  border-color: rgba(13, 148, 136, 0.3);
}

.btn-edit:hover:not(:disabled) {
  background: rgba(13, 148, 136, 0.2);
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(13, 148, 136, 0.2);
}

.btn-save {
  background: linear-gradient(135deg, #0d9488, #0891b2);
  color: white;
  border-color: rgba(255, 255, 255, 0.2);
  box-shadow: 0 2px 8px rgba(13, 148, 136, 0.3);
}

.btn-save:hover:not(:disabled) {
  background: linear-gradient(135deg, #0891b2, #0d9488);
  transform: translateY(-1px);
  box-shadow: 0 4px 16px rgba(13, 148, 136, 0.4);
}

.btn-cancel {
  background: rgba(239, 68, 68, 0.1);
  color: #dc2626;
  border-color: rgba(239, 68, 68, 0.3);
}

.btn-cancel:hover:not(:disabled) {
  background: rgba(239, 68, 68, 0.2);
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(239, 68, 68, 0.2);
}

.btn-edit:disabled,
.btn-save:disabled,
.btn-cancel:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none !important;
}
.inline-label {
  display: block;
  font-size: 0.8125rem;
  font-weight: 700;
  color: #374151;
  margin: 0.75rem 0 0.375rem 0;
  letter-spacing: 0.025em;
  text-transform: uppercase;
}
.inline-label:first-of-type {
  margin-top: 0;
}
.overview-input,
.overview-textarea {
  width: 100%;
  padding: 0.875rem 1rem;
  font-size: 0.875rem;
  border: 1px solid rgba(255, 255, 255, 0.3);
  border-radius: 0.75rem;
  background: rgba(255, 255, 255, 0.8);
  backdrop-filter: blur(10px);
  color: #1e293b;
  margin-bottom: 0.75rem;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  position: relative;
}

.overview-input:focus,
.overview-textarea:focus {
  outline: none;
  border-color: rgba(13, 148, 136, 0.5);
  box-shadow:
    0 0 0 3px rgba(13, 148, 136, 0.1),
    0 4px 12px rgba(13, 148, 136, 0.15);
  background: rgba(255, 255, 255, 0.95);
}

.overview-input::placeholder,
.overview-textarea::placeholder {
  color: #94a3b8;
  opacity: 0.8;
}

.overview-textarea {
  min-height: 3rem;
  resize: vertical;
  line-height: 1.5;
}
.form-error {
  color: var(--color-error, #dc2626);
  font-size: 0.875rem;
  margin: 0 0 0.75rem 0;
}
.text-muted {
  color: var(--color-text-muted);
}
.card-header-row .btn-inline + .btn-inline {
  margin-left: 0.5rem;
}
.demographics-inline {
  margin: 0.75rem 0 0 0;
  font-size: 0.875rem;
  color: #64748b;
  line-height: 1.6;
  background: rgba(255, 255, 255, 0.6);
  backdrop-filter: blur(10px);
  padding: 0.75rem 1rem;
  border-radius: 0.5rem;
  border: 1px solid rgba(255, 255, 255, 0.2);
}
.market-context-card .collapsible-header {
  cursor: pointer;
  user-select: none;
  transition: all 0.2s ease;
}
.market-context-card .collapsible-header:hover {
  transform: translateY(-1px);
}
.collapse-icon {
  font-size: 0.875rem;
  color: #64748b;
  margin-left: 0.5rem;
  transition: transform 0.3s ease;
}
.market-context-inner {
  padding-top: 1rem;
  animation: fadeInDown 0.4s ease-out;
}
.market-context-inner p {
  margin: 0 0 0.75rem 0;
  font-size: 0.9375rem;
  color: #64748b;
  line-height: 1.6;
  background: rgba(255, 255, 255, 0.5);
  backdrop-filter: blur(10px);
  padding: 0.875rem 1rem;
  border-radius: 0.625rem;
  border: 1px solid rgba(255, 255, 255, 0.2);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
}

@keyframes fadeInDown {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
.assumptions-compact {
  margin: 0.75rem 0 0 0;
  font-size: 0.8125rem;
  color: #64748b;
  cursor: help;
  background: rgba(255, 255, 255, 0.6);
  backdrop-filter: blur(10px);
  padding: 0.5rem 0.75rem;
  border-radius: 0.5rem;
  border: 1px solid rgba(255, 255, 255, 0.2);
  transition: all 0.2s ease;
}
.assumptions-compact:hover {
  background: rgba(255, 255, 255, 0.8);
  transform: translateY(-1px);
}
.scenario-summary {
  margin: 0 0 0.75rem 0;
  font-size: 0.9375rem;
  color: #1e293b;
  font-weight: 500;
  background: rgba(255, 255, 255, 0.6);
  backdrop-filter: blur(10px);
  padding: 0.875rem 1rem;
  border-radius: 0.625rem;
  border: 1px solid rgba(255, 255, 255, 0.2);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
}
.scenario-details-toggle {
  margin-top: 1rem;
  font-size: 0.875rem;
}
.scenario-details-toggle summary {
  cursor: pointer;
  color: #0d9488;
  font-weight: 600;
  padding: 0.5rem 0.75rem;
  background: rgba(13, 148, 136, 0.05);
  border-radius: 0.5rem;
  transition: all 0.2s ease;
  border: 1px solid rgba(13, 148, 136, 0.1);
}
.scenario-details-toggle summary:hover {
  background: rgba(13, 148, 136, 0.1);
  transform: translateY(-1px);
}
.scenario-viewer-embed {
  margin-top: 1rem;
}
.audience-stats {
  margin: 0 0 0.75rem 0;
  font-size: 0.875rem;
  color: var(--color-text);
}
.overview-next-steps { margin: 0; }
.next-steps-list {
  margin: 0;
  padding-left: 1.25rem;
  font-size: 0.875rem;
  line-height: 1.7;
  color: var(--color-text);
}
.next-steps-list li { margin-bottom: 0.25rem; }

.project-card,
.segment-card,
.hypothesis-card {
  margin-bottom: 1rem;
}
.card-subtitle {
  font-size: var(--text-md);
  font-weight: 600;
  color: var(--color-text);
  margin: 0;
}

.project-info {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.info-row {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.info-label {
  font-weight: 500;
  color: var(--color-text-muted);
  min-width: 120px;
}

.status-badge {
  padding: 0.25rem 0.75rem;
  border-radius: 9999px;
  font-size: 0.875rem;
  font-weight: 500;
}

.status-draft { background: var(--color-bg-subtle); color: var(--color-text-muted); }
.status-active,
.status-in-progress { background: var(--color-success-bg); color: var(--color-success); }
.status-completed { background: var(--color-info-bg); color: var(--color-info); }
.status-archived { background: var(--color-bg-subtle); color: var(--color-text-subtle); }

.scenario-card {
  margin-bottom: 2rem;
}

.audience-description {
  color: #4a5568;
  margin: 0 0 1rem 0;
  line-height: 1.6;
}

.scenario-loading,
.scenario-error,
.scenario-empty {
  color: #4a5568;
  margin: 0;
  padding: 0.5rem 0;
}

.scenario-error {
  color: #c53030;
}

.segment-content,
.hypothesis-content {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.content-item h4 {
  font-size: var(--text-md);
  font-weight: 600;
  color: var(--color-text);
  margin: 0 0 0.5rem 0;
}

.content-item p {
  color: var(--color-text-muted);
  line-height: 1.6;
  margin: 0;
}

/* Preserve paragraphs and bullet lines from AI-formatted text */
.formatted-text {
  white-space: pre-line;
  margin: 0;
  color: #64748b;
  line-height: 1.7;
  font-size: 0.9375rem;
  background: rgba(255, 255, 255, 0.5);
  backdrop-filter: blur(10px);
  padding: 1rem 1.25rem;
  border-radius: 0.75rem;
  border: 1px solid rgba(255, 255, 255, 0.2);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
}

.assumptions-list {
  list-style: none;
  padding: 0;
  margin: 0;
  background: rgba(255, 255, 255, 0.6);
  backdrop-filter: blur(10px);
  border-radius: 0.625rem;
  border: 1px solid rgba(255, 255, 255, 0.2);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
  overflow: hidden;
}

.assumptions-list li {
  padding: 0.75rem 1rem 0.75rem 2rem;
  position: relative;
  color: #64748b;
  border-bottom: 1px solid rgba(0, 0, 0, 0.06);
  transition: all 0.2s ease;
}

.assumptions-list li:last-child {
  border-bottom: none;
}

.assumptions-list li:hover {
  background: rgba(13, 148, 136, 0.02);
  padding-left: 2.25rem;
}

.assumptions-list li::before {
  content: '▹';
  position: absolute;
  left: 0.75rem;
  top: 0.75rem;
  color: #0d9488;
  font-weight: bold;
  font-size: 0.875rem;
  transition: all 0.2s ease;
}

.assumptions-list li:hover::before {
  color: #0891b2;
  transform: scale(1.2);
}

.loading-state,
.error-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 4rem 2rem;
  text-align: center;
}

.btn {
  padding: 0.875rem 1.75rem;
  border-radius: 0.75rem;
  font-weight: 600;
  text-decoration: none;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  border: none;
  cursor: pointer;
  position: relative;
  overflow: hidden;
  font-size: 0.875rem;
  line-height: 1.2;
}

.btn::before {
  content: '';
  position: absolute;
  top: 50%;
  left: 50%;
  width: 0;
  height: 0;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 50%;
  transform: translate(-50%, -50%);
  transition: width 0.6s, height 0.6s;
}

.btn:hover::before {
  width: 300px;
  height: 300px;
}

.btn-primary {
  background: linear-gradient(135deg, #0d9488, #0891b2);
  color: white;
  box-shadow:
    0 4px 16px rgba(13, 148, 136, 0.3),
    0 2px 8px rgba(13, 148, 136, 0.2);
  border: 1px solid rgba(255, 255, 255, 0.2);
}

.btn-primary:hover {
  background: linear-gradient(135deg, #0891b2, #0d9488);
  transform: translateY(-2px);
  box-shadow:
    0 8px 32px rgba(13, 148, 136, 0.4),
    0 4px 16px rgba(13, 148, 136, 0.3);
}

.btn-secondary {
  background: rgba(255, 255, 255, 0.8);
  backdrop-filter: blur(10px);
  color: #64748b;
  border: 1px solid rgba(255, 255, 255, 0.3);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
}

.btn-secondary:hover {
  background: rgba(255, 255, 255, 0.9);
  color: #475569;
  transform: translateY(-1px);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
}

.card-header-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  flex-wrap: wrap;
  position: relative;
}

.card-header-row .card-title {
  margin: 0;
  font-size: 1.375rem;
  font-weight: 700;
  color: #1e293b;
  background: linear-gradient(135deg, #1e293b, #334155);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  cursor: pointer;
  transition: all 0.2s ease;
}

.card-header-row .card-title:hover {
  transform: translateY(-1px);
}

.card-header-actions {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
}

@media (max-width: 768px) {
  .header-actions .btn {
    flex: 1;
    text-align: center;
  }
  .health-grid {
    grid-template-columns: 1fr;
  }
  .quick-actions-grid {
    grid-template-columns: repeat(2, 1fr);
  }
  .executive-health-row {
    flex-direction: column;
  }
  .executive-validation-row {
    flex-direction: column;
    gap: 1.5rem;
  }
  .executive-right {
    align-self: center;
  }
}

/* New Overview Design Styles */
.overview-container {
  max-width: 1400px;
  margin: 0 auto;
  padding: 1.5rem;
}

.overview-grid {
  display: grid;
  grid-template-columns: 1fr 320px;
  gap: 2rem;
  align-items: start;
}

.overview-main {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.overview-sidebar {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  position: sticky;
  top: 2rem;
}

.overview-card {
  background: white;
  border-radius: 12px;
  border: 1px solid #e5e7eb;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  padding: 1.5rem;
}

.card-title {
  font-size: 1.25rem;
  font-weight: 700;
  color: #111827;
  margin-bottom: 1.5rem;
}

/* AI Verdict Styles */
.ai-verdict-card {
  border-radius: 8px;
  padding: 1rem;
  margin-bottom: 1.5rem;
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
}

.verdict-positive {
  background: #ecfdf5;
  border: 1px solid #d1fae5;
}

.verdict-negative {
  background: #fef2f2;
  border: 1px solid #fee2e2;
}

.verdict-neutral {
  background: #fefce8;
  border: 1px solid #fde68a;
}

.verdict-icon {
  flex-shrink: 0;
  width: 24px;
  height: 24px;
  margin-top: 0.125rem;
}

.verdict-positive .verdict-icon {
  color: #16a34a;
}

.verdict-negative .verdict-icon {
  color: #dc2626;
}

.verdict-neutral .verdict-icon {
  color: #d97706;
}

.verdict-content {
  flex: 1;
}

.verdict-title {
  font-weight: 600;
  margin-bottom: 0.25rem;
}

.verdict-positive .verdict-title {
  color: #166534;
}

.verdict-negative .verdict-title {
  color: #991b1b;
}

.verdict-neutral .verdict-title {
  color: #92400e;
}

.verdict-description {
  font-size: 0.875rem;
  line-height: 1.5;
}

.verdict-positive .verdict-description {
  color: #166534;
}

.verdict-negative .verdict-description {
  color: #991b1b;
}

.verdict-neutral .verdict-description {
  color: #92400e;
}

/* Metrics Grid */
.metrics-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 1rem;
  margin-bottom: 1.5rem;
}

.metric-card {
  background: #f9fafb;
  border-radius: 8px;
  padding: 1rem;
  text-align: center;
}

.metric-label {
  font-size: 0.875rem;
  color: #6b7280;
  margin-bottom: 0.5rem;
  font-weight: 500;
}

.metric-value {
  font-size: 1.25rem;
  font-weight: 700;
  color: #111827;
}

/* Key Insight */
.key-insight {
  background: #eff6ff;
  border: 1px solid #dbeafe;
  border-radius: 8px;
  padding: 1rem;
  margin-bottom: 1.5rem;
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
}

.insight-icon {
  font-size: 1.25rem;
  flex-shrink: 0;
}

.insight-text {
  color: #1e40af;
  font-weight: 500;
  line-height: 1.5;
}

/* Significance Alert */
.significance-alert {
  background: #fef3c7;
  border: 1px solid #fde68a;
  border-radius: 8px;
  padding: 1rem;
  margin-bottom: 1.5rem;
  display: flex;
  align-items: center;
  gap: 0.75rem;
  color: #92400e;
}

.significance-alert svg {
  width: 20px;
  height: 20px;
  flex-shrink: 0;
}

/* Project Pulse */
.pulse-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 1rem;
}

.pulse-card {
  background: #f9fafb;
  border-radius: 8px;
  padding: 1rem;
  display: flex;
  align-items: center;
  gap: 0.75rem;
  transition: all 0.2s ease;
}

.pulse-card:hover {
  background: #f3f4f6;
  transform: translateY(-1px);
}

.pulse-good {
  border-left: 4px solid #10b981;
}

.pulse-warn {
  border-left: 4px solid #f59e0b;
}

.pulse-low {
  border-left: 4px solid #ef4444;
}

.pulse-icon {
  width: 32px;
  height: 32px;
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: white;
  border: 1px solid #e5e7eb;
  flex-shrink: 0;
}

.pulse-good .pulse-icon {
  color: #10b981;
}

.pulse-warn .pulse-icon {
  color: #f59e0b;
}

.pulse-low .pulse-icon {
  color: #ef4444;
}

.pulse-good .pulse-icon svg {
  color: #10b981;
}

.pulse-warn .pulse-icon svg {
  color: #f59e0b;
}

.pulse-low .pulse-icon svg {
  color: #ef4444;
}

.pulse-content {
  flex: 1;
}

.pulse-label {
  font-size: 0.875rem;
  color: #6b7280;
  margin-bottom: 0.25rem;
  font-weight: 500;
}

.pulse-value {
  font-size: 1rem;
  font-weight: 600;
  color: #111827;
  margin-bottom: 0.125rem;
}

.pulse-detail {
  font-size: 0.75rem;
  color: #9ca3af;
}

/* Research Context */
.research-content {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.research-section {
  padding: 1rem;
  background: #f9fafb;
  border-radius: 6px;
}

.research-label {
  font-size: 0.75rem;
  font-weight: 600;
  color: #6b7280;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin-bottom: 0.5rem;
}

.research-text {
  color: #374151;
  line-height: 1.5;
}

.research-link {
  color: #0d9488;
  font-weight: 500;
  text-decoration: none;
  font-size: 0.875rem;
  margin-top: 0.5rem;
  display: inline-block;
}

.research-link:hover {
  color: #0891b2;
}

/* Learning Journey */
.journey-timeline {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.journey-step {
  position: relative;
  padding-left: 2rem;
}

.journey-step:not(:last-child) {
  padding-bottom: 1rem;
}

.journey-step:not(:last-child)::after {
  content: '';
  position: absolute;
  left: 0.75rem;
  top: 2rem;
  bottom: -0.5rem;
  width: 2px;
  background: #e5e7eb;
}

.journey-node {
  background: white;
  border: 2px solid #e5e7eb;
  border-radius: 8px;
  padding: 1rem;
  position: relative;
}

.journey-node::before {
  content: '';
  position: absolute;
  left: -0.375rem;
  top: 1rem;
  width: 0.75rem;
  height: 0.75rem;
  border-radius: 50%;
  background: #e5e7eb;
}

.journey-pending {
  border-color: #e5e7eb;
}

.journey-pending::before {
  background: #e5e7eb;
}

.journey-in_progress {
  border-color: #0d9488;
  background: #ecfdf5;
}

.journey-in_progress::before {
  background: #0d9488;
}

.journey-completed {
  border-color: #10b981;
  background: #ecfdf5;
}

.journey-completed::before {
  background: #10b981;
}

.journey-type {
  font-size: 0.75rem;
  font-weight: 600;
  color: #6b7280;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin-bottom: 0.5rem;
}

.journey-title {
  font-weight: 600;
  color: #111827;
  margin-bottom: 0.5rem;
}

.journey-finding {
  font-size: 0.875rem;
  color: #374151;
  margin-bottom: 0.75rem;
  font-style: italic;
}

.journey-link {
  color: #0d9488;
  font-size: 0.875rem;
  font-weight: 500;
  text-decoration: none;
}

.journey-link:hover {
  color: #0891b2;
}

.journey-empty {
  text-align: center;
  padding: 2rem;
  color: #6b7280;
}

.journey-empty p {
  margin-bottom: 1rem;
}

/* Decision Pathway */
.decision-steps {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  margin-bottom: 2rem;
}

.decision-step {
  display: flex;
  align-items: flex-start;
  gap: 1rem;
  padding: 1rem;
  border-radius: 8px;
  border: 1px solid #e5e7eb;
  background: white;
}

.step-completed {
  border-color: #10b981;
  background: #ecfdf5;
}

.step-active {
  border-color: #0d9488;
  background: #ecfdf5;
}

.step-indicator {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f3f4f6;
  flex-shrink: 0;
  margin-top: 0.125rem;
}

.step-completed .step-indicator {
  background: #10b981;
}

.step-active .step-indicator {
  background: #0d9488;
}

.step-completed .step-indicator svg,
.step-active .step-indicator svg {
  width: 14px;
  height: 14px;
  color: white;
}

.step-content {
  flex: 1;
}

.step-label {
  font-weight: 600;
  color: #111827;
  margin-bottom: 0.25rem;
}

.step-progress {
  font-size: 0.875rem;
  color: #6b7280;
  margin-bottom: 0.5rem;
}

.step-action {
  color: #0d9488;
  font-size: 0.875rem;
  font-weight: 500;
  text-decoration: none;
}

.step-action:hover {
  color: #0891b2;
}

.success-criteria {
  border-top: 1px solid #e5e7eb;
  padding-top: 1.5rem;
}

.criteria-title {
  font-size: 1.125rem;
  font-weight: 600;
  color: #111827;
  margin-bottom: 1rem;
}

.criteria-list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.criterion-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem;
  border-radius: 6px;
  background: #f9fafb;
}

.criterion-met {
  background: #ecfdf5;
  border: 1px solid #d1fae5;
}

.criterion-check {
  width: 20px;
  height: 20px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f3f4f6;
  flex-shrink: 0;
}

.criterion-met .criterion-check {
  background: #10b981;
}

.criterion-met .criterion-check svg {
  width: 12px;
  height: 12px;
  color: white;
}

.criterion-content {
  flex: 1;
}

.criterion-label {
  font-weight: 500;
  color: #374151;
  margin-bottom: 0.125rem;
}

.criterion-value {
  font-size: 0.875rem;
  color: #6b7280;
}

/* Sidebar Cards */
.sidebar-card {
  background: white;
  border-radius: 12px;
  border: 1px solid #e5e7eb;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  padding: 1.25rem;
}

.sidebar-title {
  font-size: 1rem;
  font-weight: 600;
  color: #111827;
  margin-bottom: 1rem;
}

/* Smart Actions */
.smart-actions-list {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.smart-action-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem;
  border-radius: 6px;
  text-decoration: none;
  color: inherit;
  transition: background-color 0.15s ease;
}

.smart-action-item:hover {
  background: #f9fafb;
}

.action-icon {
  width: 32px;
  height: 32px;
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f3f4f6;
  flex-shrink: 0;
}

.action-icon svg {
  width: 16px;
  height: 16px;
  color: #6b7280;
}

.smart-action-item:hover .action-icon {
  background: #0d9488;
}

.smart-action-item:hover .action-icon svg {
  color: white;
}

.action-content {
  flex: 1;
}

.action-label {
  font-weight: 500;
  color: #111827;
  margin-bottom: 0.125rem;
}

.action-hint {
  font-size: 0.875rem;
  color: #6b7280;
}

/* Quick Stats */
.stats-list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.stat-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.5rem 0;
}

.stat-label {
  font-size: 0.875rem;
  color: #6b7280;
}

.stat-value {
  font-weight: 600;
  color: #111827;
}

/* Project Meta */
.project-meta {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  margin-bottom: 1rem;
}

.meta-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.meta-label {
  font-size: 0.875rem;
  color: #6b7280;
}

.meta-value {
  font-size: 0.875rem;
  color: #374151;
  font-weight: 500;
}

.edit-link {
  color: #0d9488;
  font-size: 0.875rem;
  font-weight: 500;
  text-decoration: none;
  display: inline-block;
}

.edit-link:hover {
  color: #0891b2;
}

/* Responsive Design */
@media (max-width: 1024px) {
  .overview-grid {
    grid-template-columns: 1fr;
    gap: 1.5rem;
  }

  .overview-sidebar {
    position: static;
    order: -1;
  }

  .pulse-grid {
    grid-template-columns: 1fr;
  }

  .metrics-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 768px) {
  .overview-container {
    padding: 1rem;
  }

  .overview-card {
    padding: 1rem;
  }

  .ai-verdict-card {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.5rem;
  }

  .verdict-icon {
    margin-top: 0;
  }
}
</style>
