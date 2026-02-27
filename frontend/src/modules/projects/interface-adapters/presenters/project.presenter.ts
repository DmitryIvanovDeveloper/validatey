import { injectable, inject } from 'inversify';
import type { CreateProjectUseCase } from '../../application/use-cases/create-project.use-case';
import type { GetProjectUseCase } from '../../application/use-cases/get-project.use-case';
import type { GetPublicProjectMetaBySlugUseCase } from '../../application/use-cases/get-public-project-meta-by-slug.use-case';
import type { UpdateProjectUseCase } from '../../application/use-cases/update-project.use-case';
import type { GetMarketContextSuggestionUseCase } from '../../application/use-cases/get-market-context-suggestion.use-case';
import type { AssessProjectRiskUseCase } from '../../application/use-cases/assess-project-risk.use-case';
import { ProjectViewModel } from '../view-models/project.view-model';
import { TYPES } from '../../infrastructure/bootstrap/types';
import { TYPES as ROOT_TYPES } from '../../../../infrastructure/bootstrap/types';
import type { LoggerPort } from '../../../../infrastructure/logging/ports/logger.port';
import { Segment } from '../../domain/value-objects/segment.vo';
import { Hypothesis, normalizeAssumptions } from '../../domain/value-objects/hypothesis.vo';
import { Project, ProjectStatus, MarketContext } from '../../domain/entities/project.entity';
import type { ProjectRisk, ProjectRiskAssessment } from '../../domain/entities/project-risk.entity';
import type { GetMarketContextSuggestionRequest } from '../../application/use-cases/input-output/get-market-context-suggestion.io';
import type { GetProjectUseCaseResponse } from '../../application/use-cases/input-output/get-project.io';
import type { GetProjectOverviewUseCase } from '../../application/use-cases/get-project-overview.use-case';

@injectable()
export class ProjectPresenter {
  readonly labels = {
    // PageHeader
    titleEdit: 'Edit Project',
    titleCreate: 'Create New Project',
    subtitle: 'Define segment, hypothesis, scenario, and audience',
    breadcrumbProjects: 'Projects',
    breadcrumbEdit: 'Edit Project',
    breadcrumbNew: 'New Project',
    // Step 0: Who & what?
    step1Title: 'Step 1: Who & what?',
    step1Description: "Describe your audience and what you're testing",
    sectionWho: 'Who? (Segment)',
    segmentDescription: 'Segment Description *',
    segmentPlaceholder: 'Example: Young professionals aged 25-35 working in IT...',
    demographics: 'Demographics *',
    demographicsPlaceholder: 'Example: Age: 25-35 | Location: Major cities | Profession: Software engineers',
    sectionWhat: 'What are we testing?',
    hypothesisDescription: 'Hypothesis Description',
    hypothesisPlaceholder: 'Example: We believe that young IT professionals want to learn in a gamified format...',
    assumptions: 'Assumptions',
    assumptionPlaceholder: (n: number) => `Assumption ${n}`,
    addAssumption: '+ Add Assumption',
    marketPicture: 'Market Picture',
    marketPicturePlaceholder: 'Current market: main players, offerings...',
    marketFit: 'Market Fit',
    marketFitPlaceholder: 'How your product fits...',
    differentiation: 'Differentiation',
    differentiationPlaceholder: 'How your product differs...',
    marketContextHint: 'Fill in segment or hypothesis above for a relevant suggestion.',
    suggestWithAI: 'Suggest with AI',
    loading: 'Loading...',
    // Step 1: How?
    step2Title: 'Step 2: What type of validation do you need?',
    step2Description: 'Choose the validation approach that fits your current stage',
    respondentsNeeded: (n: number) => `${n} respondents needed`,
    generateWithAI: 'Generate with AI',
    betaBadge: 'Beta',
    // Validation type descriptions
    problemValidationDesc: 'Deep interviews to understand user problems and willingness to pay',
    solutionValidationDesc: 'Interviews + prototype testing to validate solutions and features',
    pricingValidationDesc: 'Interviews + surveys to test price sensitivity and willingness to pay',
    surveyDesc: 'Online surveys for statistical significance with larger samples',
    statisticalAnalysisDesc: 'A/B tests and RCT for classic statistical analysis',
    // Step 2: Who to ask?
    step3Title: 'Step 3: Who will we ask?',
    step3Description: 'Project name, size, and how you will find respondents',
    projectName: 'Project Name *',
    projectNamePlaceholder: 'Example: Gamified Learning - IT Professionals',
    howFindRespondents: 'How will you find respondents?',
    audienceShare: 'Public link (I\'ll share in communities)',
    audienceEmail: 'I have a list of emails',
    audienceEmailHint: 'Import CSV or connect HubSpot on the Invitations page after creating the project.',
    audienceHintGeneral: 'You can enable a public link or share link on the Invitations page after creating the project.',
    // AI generation
    generatingScenario: 'Generating AI Scenario',
    creatingFor: (name: string) => `Creating customized questions for your ${name}...`,
    percentComplete: (n: number) => `${n}% complete`,
    tryAgain: 'Try Again',
    // Modal
    scenarioWarningsTitle: 'Scenario structure warnings',
    scenarioWarningsIntro: 'The scenario may not fully match the selected template. You can still save or go back to edit.',
    saveAnyway: 'Save anyway',
    backToScenario: 'Back to scenario',
    // Wizard steps
    wizardStepWho: 'Who & what?',
    wizardStepHow: 'How?',
    wizardStepWhoAsk: 'Who to ask?',
    // ProjectSettingsWidget
    settingsTitle: 'Project Settings',
    settingsProjectNameLabel: 'Project Name',
    settingsProjectNamePlaceholder: 'Enter project name',
    settingsSegmentLabel: 'Segment Description',
    settingsSegmentPlaceholder: 'Describe your target segment',
    settingsUpdating: 'Updating...',
    // GettingStartedWidget (passed as props from view)
    gettingStartedTitle: 'Getting Started',
    gettingStartedSubtitle: 'Follow these steps to validate your hypothesis',
    gettingStartedDismissAria: 'Dismiss getting started guide',
    gettingStartedStep1Title: 'Start Research',
    gettingStartedStep1Description: 'Get AI-powered market and competitive research for your hypothesis',
    gettingStartedStep1Action: 'Start Research',
    gettingStartedStep2Title: 'Collect Comments',
    gettingStartedStep2Description: 'Fetch real feedback from Reddit, Hacker News, and LinkedIn',
    gettingStartedStep2Action: 'Go to Comments',
    gettingStartedStep3Title: 'Analyze Results',
    gettingStartedStep3Description: 'Review validation insights and make data-driven decisions',
    gettingStartedStep3Action: 'View Overview',
    // SurveyPlatformsWidget (passed as props from view)
    surveyPlatformsTitle: 'Survey Distribution Platforms',
    surveyPlatformsGenerate: 'Generate',
    surveyPlatformsGenerating: 'Generating...',
    surveyPlatformsAnalyzing: 'Analyzing your project to suggest optimal platforms…',
    surveyPlatformsReady: 'Ready to find the best platforms for your survey.',
    surveyPlatformsReadyHint: 'Click "Generate Platforms" to get AI-powered recommendations.',
    surveyPlatformsPostLabel: 'Ready-to-post message',
    surveyPlatformsCopy: 'Copy',
    surveyPlatformsCopied: 'Copied',
    // ProjectDashboardView
    dashboardBreadcrumbProjects: 'Projects',
    dashboardTabOverview: 'Overview',
    dashboardTabScraper: 'Scraper',
    dashboardTabInvitations: 'Invitations',
    dashboardTabResponses: 'Responses',
    dashboardTabComments: 'Comments',
    dashboardTabReport: 'Report',
    dashboardBackToOverview: '← Back to Overview',
    dashboardDefaultProjectName: 'Project',
    // ProjectDashboardGuestView
    guestLoading: 'Loading project…',
    guestErrorTitle: 'Unable to load project',
    guestSignIn: 'Sign in',
    guestBadge: 'Guest view · Read-only',
    guestSignInToEdit: 'Sign in to edit',
    guestSectionHypothesis: 'Hypothesis',
    guestSectionKeyAssumptions: 'Key Assumptions',
    guestSectionDecisionPathway: 'Decision Pathway',
    guestSectionResponsePace: 'Response Pace',
    guestMetricCurrent: 'Current',
    guestMetricResponses: 'Responses',
    guestResponseRatePct: (pct: number) => `${pct}% response rate`,
    guestSectionLearningJourney: 'Learning Journey',
    guestRoundsHintEmpty: 'Rounds help you track each iteration of your validation. Sign in to start a round.',
    guestRoundsHintNewRound: 'Sign in to start a new round.',
    guestEvidenceLabel: 'Evidence',
    guestEvidenceNeedMore: 'Why more data is needed',
    guestEvidenceNotSupported: 'Why not supported',
    guestEvidenceExplanation: 'Explanation',
    guestPlaceholderStartResearch: 'Start Research',
    guestPlaceholderStartResearchMessage: 'Sign in to run research and collect responses.',
    guestPlaceholderResearchOverview: 'Research Overview',
    guestPlaceholderResearchOverviewMessage: 'Sign in to view research data.',
    guestPlaceholderShowDetails: 'Show Details',
    guestPlaceholderShowDetailsMessage: 'Sign in to view details.',
    guestPlaceholderTopPainPoints: 'Top Pain Points',
    guestPlaceholderTopPainPointsMessage: 'Sign in to view pain points.',
    guestPlaceholderComments: 'Comments Overview',
    guestPlaceholderCommentsMessage: 'Sign in to view comments.',
    guestPlaceholderCommentPatterns: 'Comment Pattern Analysis',
    guestPlaceholderCommentPatternsMessage: 'Sign in to view pattern analysis.',
    guestSignInLabel: 'Sign in',
    // EditProjectView
    editBreadcrumbProject: 'Project',
    editBreadcrumbEdit: 'Edit',
    editPageTitle: 'Edit project',
    editLoadingProject: 'Loading project…',
    editBackToOverview: 'Back to Overview',
    editSavedAndBack: 'Saved. ',
    editSectionSegment: 'Segment & demographics',
    editSegmentDescriptionLabel: 'Segment description',
    editSegmentDescriptionPlaceholder: 'Describe your target segment',
    editDemographicsLabel: 'Demographics',
    editDemographicsPlaceholder: 'e.g. B2B, 25-45, tech sector or JSON: {"role": "PM", "company_size": "50-200"}',
    editSectionHypothesis: 'Hypothesis',
    editHypothesisDescriptionLabel: 'Hypothesis description',
    editHypothesisPlaceholder: 'What are we validating?',
    editAssumptionsLabel: 'Assumptions',
    editAssumptionPlaceholder: 'Assumption',
    editRemoveAria: 'Remove',
    editAddAssumption: '+ Add assumption',
    editSectionMarket: 'Market context (optional)',
    editMarketPictureLabel: 'Market picture',
    editMarketPicturePlaceholder: 'Brief market overview',
    editMarketFitLabel: 'Market fit',
    editMarketFitPlaceholder: 'How your solution fits',
    editDifferentiationLabel: 'Differentiation',
    editDifferentiationPlaceholder: 'What makes you different',
    editCancel: 'Cancel',
    editSaveChanges: 'Save changes',
    editSaving: 'Saving…',
    // ProjectDetailsView section titles and actions
    detailsSectionHypothesis: 'Hypothesis',
    detailsSectionKeyAssumptions: 'Key Assumptions',
    detailsSectionResearchContext: 'Research Context',
    detailsSectionHypothesisSubtitle: 'Hypothesis',
    detailsSectionDecisionPathway: 'Decision Pathway',
    detailsSectionLearningJourney: 'Learning Journey',
    detailsNewRound: '+ New Round',
    detailsStartNewRound: '+ Start New Round',
    detailsModalStartNewRound: 'Start New Round',
  };

  constructor(
    @inject(TYPES.CreateProjectUseCase)
    private readonly _createProjectUseCase: CreateProjectUseCase,
    @inject(TYPES.GetProjectUseCase)
    private readonly _getProjectUseCase: GetProjectUseCase,
    @inject(TYPES.GetPublicProjectMetaBySlugUseCase)
    private readonly _getPublicProjectMetaBySlugUseCase: GetPublicProjectMetaBySlugUseCase,
    @inject(TYPES.UpdateProjectUseCase)
    private readonly _updateProjectUseCase: UpdateProjectUseCase,
    @inject(TYPES.GetMarketContextSuggestionUseCase)
    private readonly _getMarketContextSuggestionUseCase: GetMarketContextSuggestionUseCase,
    @inject(TYPES.AssessProjectRiskUseCase)
    private readonly _assessProjectRiskUseCase: AssessProjectRiskUseCase,
    @inject(TYPES.GetProjectOverviewUseCase)
    private readonly _getProjectOverviewUseCase: GetProjectOverviewUseCase,
    @inject(ROOT_TYPES.Logger)
    private readonly _logger: LoggerPort
  ) {}
  
  async createProject(
    name: string,
    segmentDescription?: string,
    segmentDemographics?: string,
    hypothesisDescription?: string,
    hypothesisAssumptions?: string[],
    marketContext?: MarketContext | null,
    scenarioTemplateSlug?: string,
    workspaceId?: string | null
  ): Promise<{ projectId: string | null; error?: string }> {
    try {
      // Validate and create Segment
      let segment: Segment | null = null;
      if (segmentDescription && segmentDescription.trim().length > 0 && segmentDemographics && segmentDemographics.trim().length > 0) {
        try {
          let demographicsParsed: Record<string, unknown> = {};
          try {
            demographicsParsed = (typeof segmentDemographics === 'string'
              ? JSON.parse(segmentDemographics)
              : segmentDemographics) as Record<string, unknown>;
          } catch {
            demographicsParsed = { text: segmentDemographics };
          }
          segment = new Segment(segmentDescription.trim(), demographicsParsed);
        } catch (error) {
          this._logger.warn('Failed to create Segment, continuing without it', { error });
          segment = null;
        }
      }

      // Validate and create Hypothesis
      let hypothesis: Hypothesis | null = null;
      if (hypothesisDescription && hypothesisDescription.trim().length > 0) {
        try {
          const validAssumptions = hypothesisAssumptions
            ? hypothesisAssumptions.filter((a) => a && typeof a === 'string' && a.trim().length > 0)
            : [];
          hypothesis = new Hypothesis(
            hypothesisDescription.trim(),
            validAssumptions.length > 0 ? normalizeAssumptions(validAssumptions) : []
          );
        } catch (error) {
          this._logger.warn('Failed to create Hypothesis, continuing without it', { error });
          hypothesis = null;
        }
      }

        // Create project
      console.log('🔄 Creating project with name:', name);
      const result = await this._createProjectUseCase.execute({
        name,
        workspaceId: workspaceId ?? undefined,
      });

      if (!result.isSuccess) {
        // Safe error message extraction
        let errorMessage = 'Unknown error';
        if (result.error instanceof Error) {
          errorMessage = result.error.message;
        } else if (typeof result.error === 'string') {
          errorMessage = result.error;
        } else {
          errorMessage = JSON.stringify(result.error);
        }
        
        this._logger.error('Failed to create project', { 
          error: errorMessage,
          errorDetails: result.error 
        });
        console.error('❌ Failed to create project. Error:', errorMessage);
        return { projectId: null, error: errorMessage };
      }

      const projectId = result.data.project.id;
      console.log('✅ Project created with ID:', projectId);
      
      // Update project with segment, hypothesis and marketContext if available
      if (segment || hypothesis || marketContext) {
        console.log('🔄 Updating project with segment/hypothesis/marketContext');
        const updateResult = await this._updateProjectUseCase.execute({
          projectId,
          updates: {
            segment: segment || undefined,
            hypothesis: hypothesis || undefined,
            marketContext: marketContext ?? undefined,
          },
        });

        if (!updateResult.isSuccess) {
          this._logger.warn('Failed to update project with segment/hypothesis, but project was created', {
            projectId,
            error: updateResult.error
          });
          // Don't return null, project is already created
        } else {
          console.log('✅ Project updated with segment/hypothesis');
        }
      }
      
      this._logger.info('Project created successfully', { projectId });
      return { projectId };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this._logger.error('Unexpected error during project creation', { 
        error: errorMessage,
        errorDetails: error 
      });
      console.error('❌ Unexpected error:', error);
      return { projectId: null, error: errorMessage };
    }
  }

  async getProject(projectId: string): Promise<{ project: Project | null; error?: string }> {
    const result = await this._getProjectUseCase.execute({ projectId });
    if (!result.isSuccess) {
      return { project: null, error: result.error?.message ?? 'Failed to load project' };
    }
    const projectData = result.data.project;
    const segment = projectData.segment
      ? new Segment(projectData.segment.description, projectData.segment.demographics)
      : null;
    const hypothesis = projectData.hypothesis
      ? new Hypothesis(projectData.hypothesis.description, projectData.hypothesis.assumptions?.length ? projectData.hypothesis.assumptions : [])
      : null;
    const project = new Project(
      projectData.id,
      projectData.name,
      segment,
      hypothesis,
      projectData.marketContext ?? null,
      projectData.status as ProjectStatus,
      new Date(projectData.createdAt),
      new Date(projectData.updatedAt),
      undefined,
      undefined,
      undefined,
      undefined,
      projectData.publicAccessEnabled ?? false,
      projectData.publicSlug ?? null,
      projectData.maxPublicResponses ?? null,
      projectData.requirePublicEmail ?? false,
      projectData.captchaEnabled ?? false
    );
    return { project };
  }

  async loadProject(projectId: string, viewModel: ProjectViewModel): Promise<void> {
    viewModel.loading.value = true;
    viewModel.error.value = null;

    const result = await this._getProjectUseCase.execute({ projectId });

    if (result.isSuccess) {
      const projectData = result.data.project as GetProjectUseCaseResponse['project'];
      
      // Map response to Project entity
      const segment = projectData.segment 
        ? new Segment(projectData.segment.description, projectData.segment.demographics)
        : null;
      
      const hypothesis = projectData.hypothesis
        ? new Hypothesis(projectData.hypothesis.description, projectData.hypothesis.assumptions?.length ? projectData.hypothesis.assumptions : [])
        : null;
      
      const project = new Project(
        projectData.id,
        projectData.name,
        segment,
        hypothesis,
        projectData.marketContext ?? null,
        projectData.status as ProjectStatus,
        new Date(projectData.createdAt),
        new Date(projectData.updatedAt),
        undefined,
        undefined,
        undefined,
        undefined,
        projectData.publicAccessEnabled ?? false,
        projectData.publicSlug ?? null,
        projectData.maxPublicResponses ?? null,
        projectData.requirePublicEmail ?? false,
        projectData.captchaEnabled ?? false,
        projectData.scenarioTemplateSlug ?? null
      );
      
      console.log('Presenter: Setting project to viewModel', project);
      viewModel.project.value = project;
      console.log('Presenter: viewModel.project.value set to', viewModel.project.value);
      viewModel.loading.value = false;
      this._logger.info('Project loaded', { projectId });
    } else {
      // Safe error message extraction
      const errorMessage = result.error instanceof Error
        ? result.error.message
        : typeof result.error === 'string'
          ? result.error
          : 'Failed to load project';
      viewModel.error.value = errorMessage;
      viewModel.loading.value = false;
      this._logger.error('Failed to load project', { projectId, error: result.error });
    }
  }

  async loadOverview(projectId: string, viewModel: ProjectViewModel): Promise<void> {
    const result = await this._getProjectOverviewUseCase.execute({ projectId });

    if (result.isSuccess) {
      viewModel.overview.value = result.data.overview;
      this._logger.info('Project overview loaded', { projectId });
    } else {
      this._logger.error('Failed to load project overview', { projectId, error: result.error });
      viewModel.overview.value = null;
    }
  }

  /**
   * Load project and overview as guest by public slug. Sets viewModel.project, viewModel.overview, viewModel.loading, viewModel.error.
   */
  async loadGuestOverview(slug: string, viewModel: ProjectViewModel): Promise<void> {
    viewModel.loading.value = true;
    viewModel.error.value = null;
    viewModel.project.value = null;
    viewModel.overview.value = null;

    const metaResult = await this._getPublicProjectMetaBySlugUseCase.execute({ slug });
    if (!metaResult.isSuccess) {
      viewModel.error.value = metaResult.error?.message ?? 'Project not found';
      viewModel.loading.value = false;
      this._logger.error('Guest: failed to resolve slug', { slug, error: metaResult.error });
      return;
    }
    const projectId = metaResult.data.id;

    const projectResult = await this._getProjectUseCase.execute({ projectId, guestSlug: slug });
    if (!projectResult.isSuccess) {
      viewModel.error.value = projectResult.error?.message ?? 'Failed to load project';
      viewModel.loading.value = false;
      this._logger.error('Guest: failed to load project', { projectId, slug, error: projectResult.error });
      return;
    }
    const projectData = projectResult.data.project as GetProjectUseCaseResponse['project'];
    const segment = projectData.segment
      ? new Segment(projectData.segment.description, projectData.segment.demographics)
      : null;
    const hypothesis = projectData.hypothesis
      ? new Hypothesis(projectData.hypothesis.description, projectData.hypothesis.assumptions?.length ? projectData.hypothesis.assumptions : [])
      : null;
    const project = new Project(
      projectData.id,
      projectData.name,
      segment,
      hypothesis,
      projectData.marketContext ?? null,
      projectData.status as ProjectStatus,
      new Date(projectData.createdAt),
      new Date(projectData.updatedAt),
      undefined,
      undefined,
      undefined,
      undefined,
      projectData.publicAccessEnabled ?? false,
      projectData.publicSlug ?? null,
      projectData.maxPublicResponses ?? null,
      projectData.requirePublicEmail ?? false,
      projectData.captchaEnabled ?? false,
      projectData.scenarioTemplateSlug ?? null
    );
    viewModel.project.value = project;

    const overviewResult = await this._getProjectOverviewUseCase.execute({ projectId, guestSlug: slug });
    if (overviewResult.isSuccess) {
      viewModel.overview.value = overviewResult.data.overview;
      this._logger.info('Guest overview loaded', { projectId, slug });
    } else {
      this._logger.error('Guest: failed to load overview', { projectId, slug, error: overviewResult.error });
      viewModel.overview.value = null;
    }
    viewModel.loading.value = false;
  }

  async updateProject(
    projectId: string,
    name?: string,
    segmentDescription?: string,
    segmentDemographics?: string | Record<string, unknown>,
    hypothesisDescription?: string,
    hypothesisAssumptions?: string[],
    status?: string,
    marketContext?: MarketContext | null,
    scenarioTemplateSlug?: string | null,
    consentText?: string | null,
    dataUsageText?: string | null,
    privacyPolicyUrl?: string | null,
    termsOfServiceUrl?: string | null,
    publicAccessEnabled?: boolean,
    publicSlug?: string | null,
    maxPublicResponses?: number | null,
    requirePublicEmail?: boolean,
    captchaEnabled?: boolean
  ): Promise<{ ok: boolean; error?: string; project?: { publicAccessEnabled?: boolean; publicSlug?: string | null; maxPublicResponses?: number | null; requirePublicEmail?: boolean; captchaEnabled?: boolean } }> {
    try {
      let segment: Segment | undefined = undefined;
      if (segmentDescription && segmentDescription.trim().length > 0 && segmentDemographics) {
        try {
          let demographicsParsed: Record<string, unknown> = {};
          if (typeof segmentDemographics === 'string') {
            try {
              demographicsParsed = JSON.parse(segmentDemographics) as Record<string, unknown>;
            } catch {
              demographicsParsed = { text: segmentDemographics };
            }
          } else {
            demographicsParsed = segmentDemographics;
          }
          segment = new Segment(segmentDescription.trim(), demographicsParsed);
        } catch (error) {
          this._logger.warn('Failed to create Segment for update', { error });
          segment = undefined;
        }
      }
      
      let hypothesis: Hypothesis | undefined = undefined;
      if (hypothesisDescription && hypothesisDescription.trim().length > 0) {
        try {
          const validAssumptions = hypothesisAssumptions && hypothesisAssumptions.length > 0
            ? normalizeAssumptions(hypothesisAssumptions.filter(a => a && a.trim().length > 0))
            : [];
          hypothesis = new Hypothesis(hypothesisDescription.trim(), validAssumptions);
        } catch (error) {
          this._logger.warn('Failed to create Hypothesis for update', { error });
          hypothesis = undefined;
        }
      }

      const result = await this._updateProjectUseCase.execute({
        projectId,
        updates: {
          name,
          segment,
          hypothesis,
          status: status as ProjectStatus | undefined,
          marketContext: marketContext ?? undefined,
          scenarioTemplateSlug: scenarioTemplateSlug ?? undefined,
          consentText: consentText ?? undefined,
          dataUsageText: dataUsageText ?? undefined,
          privacyPolicyUrl: privacyPolicyUrl ?? undefined,
          termsOfServiceUrl: termsOfServiceUrl ?? undefined,
          publicAccessEnabled: publicAccessEnabled ?? undefined,
          publicSlug: publicSlug ?? undefined,
          maxPublicResponses: maxPublicResponses ?? undefined,
          requirePublicEmail: requirePublicEmail ?? undefined,
          captchaEnabled: captchaEnabled ?? undefined,
        },
      });

      if (result.isSuccess) {
        this._logger.info('Project updated', { projectId });
        return { ok: true, project: result.data.project };
      } else {
        const errorMessage = result.error instanceof Error
          ? result.error.message
          : typeof result.error === 'string'
            ? result.error
            : 'Failed to update project';
        this._logger.error('Failed to update project', { projectId, error: errorMessage, errorDetails: result.error });
        return { ok: false, error: errorMessage };
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this._logger.error('Unexpected error during project update', { projectId, error: errorMessage, errorDetails: error });
      return { ok: false, error: errorMessage };
    }
  }

  async updateProjectPublicSettings(
    projectId: string,
    opts: {
      publicAccessEnabled?: boolean;
      maxPublicResponses?: number | null;
      requirePublicEmail?: boolean;
      captchaEnabled?: boolean;
    }
  ): Promise<{ ok: boolean; error?: string; project?: { publicAccessEnabled?: boolean; publicSlug?: string | null; maxPublicResponses?: number | null; requirePublicEmail?: boolean; captchaEnabled?: boolean } }> {
    try {
      const result = await this._updateProjectUseCase.execute({
        projectId,
        updates: {
          publicAccessEnabled: opts.publicAccessEnabled ?? undefined,
          maxPublicResponses: opts.maxPublicResponses ?? undefined,
          requirePublicEmail: opts.requirePublicEmail ?? undefined,
          captchaEnabled: opts.captchaEnabled ?? undefined,
        },
      });
      if (result.isSuccess) {
        this._logger.info('Project public settings updated', { projectId });
        return { ok: true, project: result.data.project };
      } else {
        const errorMessage = result.error instanceof Error ? result.error.message : typeof result.error === 'string' ? result.error : 'Failed to update project';
        this._logger.error('Failed to update project public settings', { projectId, error: errorMessage, errorDetails: result.error });
        return { ok: false, error: errorMessage };
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this._logger.error('Unexpected error during project public settings update', { projectId, error: errorMessage, errorDetails: error });
      return { ok: false, error: errorMessage };
    }
  }

  async updateProjectViewModel(
    projectId: string,
    updates: {
      name?: string;
      segmentDescription?: string;
      segmentDemographics?: string | Record<string, unknown>;
      hypothesisDescription?: string;
      hypothesisAssumptions?: string[];
      status?: string;
      marketContext?: MarketContext | null;
    },
    viewModel: ProjectViewModel
  ): Promise<void> {
    viewModel.loading.value = true;
    viewModel.error.value = null;

    const result = await this.updateProject(
      projectId,
      updates.name,
      updates.segmentDescription,
      updates.segmentDemographics,
      updates.hypothesisDescription,
      updates.hypothesisAssumptions,
      updates.status,
      updates.marketContext
    );

    if (result.ok) {
      viewModel.loading.value = false;
      this._logger.info('Project updated', { projectId });
    } else {
      viewModel.error.value = 'Failed to update project';
      viewModel.loading.value = false;
    }
  }

  async getMarketContextSuggestions(
    segmentDescription: string,
    segmentDemographics: string,
    productDescription?: string
  ): Promise<{ marketPicture?: string; marketFit?: string; differentiation?: string } | null> {
    try {
      const request: GetMarketContextSuggestionRequest = {
        segmentDescription,
        segmentDemographics,
        productDescription,
      };

      const result = await this._getMarketContextSuggestionUseCase.execute(request);

      if (result.isSuccess) {
        this._logger.info('Market context suggestions retrieved successfully');
        return result.data;
      } else {
        this._logger.error('Failed to get market context suggestions', { error: result.error });
        throw result.error;
      }
    } catch (error) {
      this._logger.error('Unexpected error getting market context suggestions', { error });
      throw error instanceof Error ? error : new Error('Failed to get market context suggestions');
    }
  }

  async assessProjectRisk(
    hypothesis: string,
    segment: string,
    assumptions: string[]
  ): Promise<{ risks: ProjectRisk[]; overallRiskScore: number }> {
    try {
      const assessment = await this._assessProjectRiskUseCase.execute(hypothesis, segment, assumptions);
      return { risks: Array.from(assessment.risks), overallRiskScore: assessment.overallRiskScore };
    } catch (error) {
      this._logger.warn('Risk assessment failed, returning empty result', { error });
      return { risks: [], overallRiskScore: 0 };
    }
  }
}

