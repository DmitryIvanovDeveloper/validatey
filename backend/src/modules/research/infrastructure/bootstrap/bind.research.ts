import { Container } from 'inversify';
import { TYPES } from './types';
import { TYPES as RESPONSES_TYPES } from '../../../responses/infrastructure/bootstrap/types';
import { COMMENT_TYPES } from '../../../comments/types';
import { ResearchDataRepositoryPort } from '../../application/ports/research-data-repository.port';
import type { SynthesisLlmPort } from '../../application/ports/synthesis-llm.port';
import type { AssumptionAssessmentLlmPort } from '../../application/ports/assumption-assessment-llm.port';
import type { MarketDataProviderPort } from '../../application/ports/market-data-provider.port';
import type { CompetitorDataProviderPort } from '../../application/ports/competitor-data-provider.port';
import type { AutocompleteDataProviderPort } from '../../application/ports/autocomplete-data-provider.port';
import type { AcademicPapersProviderPort } from '../../application/ports/academic-papers-provider.port';
import type { ProductHuntProviderPort } from '../../application/ports/product-hunt-provider.port';
import type { HnSearchCommentsCollectorPort } from '../../application/ports/hn-search-comments-collector.port';
import type { RedditSearchCommentsCollectorPort } from '../../application/ports/reddit-search-comments-collector.port';
import type { RedditSubredditsGeneratorPort } from '../../application/ports/reddit-subreddits-generator.port';
import type { SearchPhrasesGeneratorPort } from '../../application/ports/search-phrases-generator.port';
import type { AutocompleteApiPort } from '../../application/ports/autocomplete-api.port';
import type { ResearchAssistantLlmPort } from '../../application/ports/research-assistant-llm.port';
import type { UserStoriesLlmPort } from '../../application/ports/user-stories-llm.port';
import type { ResponseRepositoryPort } from '../../../responses/application/ports/response-repository.port';
import type { CommentRepositoryPort } from '../../../comments/application/ports/comment-repository.port';
import { GetResearchCanvasUseCase } from '../../application/use-cases/get-research-canvas.use-case';
import { GenerateSynthesisUseCase } from '../../application/use-cases/generate-synthesis.use-case';
import { GenerateAssumptionAssessmentsUseCase } from '../../application/use-cases/generate-assumption-assessments.use-case';
import { GenerateUserStoriesUseCase } from '../../application/use-cases/generate-user-stories.use-case';
import { CheckResearchAvailabilityUseCase } from '../../application/use-cases/check-research-availability.use-case';
import { CollectResearchDataUseCase } from '../../application/use-cases/collect-research-data.use-case';
import { ResearchAssistantUseCase } from '../../application/use-cases/research-assistant.use-case';
import { SupabaseResearchRepository } from '../repositories/supabase-research.repository';
import { SynthesisLlmAdapter } from '../services/synthesis-llm.adapter';
import { SynthesisLlmStubAdapter } from '../services/synthesis-llm-stub.adapter';
import { AssumptionAssessmentLlmAdapter } from '../services/assumption-assessment-llm.adapter';
import { ResearchAssistantLlmAdapter } from '../services/research-assistant-llm.adapter';
import { UserStoriesLlmAdapter } from '../services/user-stories-llm.adapter';
import { MarketDataProviderStubAdapter } from '../services/market-data-provider-stub.adapter';
import { CompetitorDataProviderStubAdapter } from '../services/competitor-data-provider-stub.adapter';
import { StubAcademicPapersProviderAdapter } from '../services/stub-academic-papers-provider.adapter';
import { SemanticScholarPapersProviderAdapter } from '../services/semantic-scholar-papers-provider.adapter';
import { OpenAlexPapersProviderAdapter } from '../services/open-alex-papers-provider.adapter';
import { CorePapersProviderAdapter } from '../services/core-papers-provider.adapter';
import { LlmMarketDataProviderAdapter } from '../services/llm-market-data-provider.adapter';
import { LlmCompetitorDataProviderAdapter } from '../services/llm-competitor-data-provider.adapter';
import { LlmSearchPhrasesGeneratorAdapter } from '../services/llm-search-phrases-generator.adapter';
import { GooglePlaceAutocompleteAdapter } from '../services/google-place-autocomplete.adapter';
import { AutocompleteDataProviderAdapter } from '../services/autocomplete-data-provider.adapter';
import { ResearchController } from '../../interface-adapters/controllers/research.controller';
import { HnSearchCommentsCollectorAdapter } from '../../../comments/infrastructure/adapters/hn-search-comments-collector.adapter';
import { RedditSearchCommentsCollectorAdapter } from '../../../comments/infrastructure/adapters/reddit-search-comments-collector.adapter';
import { RedditSubredditsGeneratorAdapter } from '../services/reddit-subreddits-generator.adapter';
import { ProductHuntAlgoliaProviderAdapter } from '../services/product-hunt-algolia-provider.adapter';

// Enable real LLM providers for market and competitor research
const useLlmResearchProviders = true;
// Academic paper search provider priority: Semantic Scholar > OpenAlex (free) > CORE > Stub
// SEMANTIC_SCHOLAR_ENABLED=true activates academic search.
// OpenAlex needs no key and has better relevance/citation data than CORE.
// CORE is kept as a fallback only if OpenAlex is explicitly disabled.
const useAcademicPapers = process.env.SEMANTIC_SCHOLAR_ENABLED === 'true';
const useSemanticScholar = useAcademicPapers && !!process.env.SEMANTIC_SCHOLAR_API_KEY?.trim();
const useCoreOnly = useAcademicPapers && !useSemanticScholar && process.env.ACADEMIC_PROVIDER === 'core';

export function bindResearch(container: Container): void {
  container.bind<ResearchDataRepositoryPort>(TYPES.ResearchDataRepository).to(SupabaseResearchRepository);
  // Use real synthesis LLM for comprehensive analysis
  container.bind<SynthesisLlmPort>(TYPES.SynthesisLlm).to(SynthesisLlmAdapter);
  container.bind<AssumptionAssessmentLlmPort>(TYPES.AssumptionAssessmentLlm).to(AssumptionAssessmentLlmAdapter);
  container.bind<ResearchAssistantLlmPort>(TYPES.ResearchAssistantLlm).to(ResearchAssistantLlmAdapter);
  container.bind<UserStoriesLlmPort>(TYPES.UserStoriesLlm).to(UserStoriesLlmAdapter);
  container
    .bind<MarketDataProviderPort>(TYPES.MarketDataProvider)
    .to(useLlmResearchProviders ? LlmMarketDataProviderAdapter : MarketDataProviderStubAdapter);
  container
    .bind<CompetitorDataProviderPort>(TYPES.CompetitorDataProvider)
    .to(useLlmResearchProviders ? LlmCompetitorDataProviderAdapter : CompetitorDataProviderStubAdapter);
  container.bind<SearchPhrasesGeneratorPort>(TYPES.SearchPhrasesGenerator).to(LlmSearchPhrasesGeneratorAdapter);
  container.bind<AutocompleteApiPort>(TYPES.AutocompleteApi).to(GooglePlaceAutocompleteAdapter);
  container.bind<AutocompleteDataProviderPort>(TYPES.AutocompleteDataProvider).to(AutocompleteDataProviderAdapter);
  // Priority: Semantic Scholar (best, needs key) > OpenAlex (free, best quality) > CORE (fallback) > Stub
  container
    .bind<AcademicPapersProviderPort>(TYPES.AcademicPapersProvider)
    .to(
      useSemanticScholar
        ? SemanticScholarPapersProviderAdapter
        : useCoreOnly
          ? CorePapersProviderAdapter
          : useAcademicPapers
            ? OpenAlexPapersProviderAdapter
            : StubAcademicPapersProviderAdapter
    );
  container
    .bind<HnSearchCommentsCollectorPort>(TYPES.HnSearchCommentsCollector)
    .to(HnSearchCommentsCollectorAdapter);
  container
    .bind<RedditSearchCommentsCollectorPort>(TYPES.RedditSearchCommentsCollector)
    .to(RedditSearchCommentsCollectorAdapter);
  container
    .bind<RedditSubredditsGeneratorPort>(TYPES.RedditSubredditsGenerator)
    .to(RedditSubredditsGeneratorAdapter);
  container
    .bind<ProductHuntProviderPort>(TYPES.ProductHuntProvider)
    .to(ProductHuntAlgoliaProviderAdapter);
  container.bind<GetResearchCanvasUseCase>(TYPES.GetResearchCanvasUseCase).to(GetResearchCanvasUseCase);
  container.bind<GenerateSynthesisUseCase>(TYPES.GenerateSynthesisUseCase).to(GenerateSynthesisUseCase);
  container.bind<GenerateAssumptionAssessmentsUseCase>(TYPES.GenerateAssumptionAssessmentsUseCase).to(GenerateAssumptionAssessmentsUseCase);
  container.bind<GenerateUserStoriesUseCase>(TYPES.GenerateUserStoriesUseCase).to(GenerateUserStoriesUseCase);
  container.bind<CheckResearchAvailabilityUseCase>(TYPES.CheckResearchAvailabilityUseCase).to(CheckResearchAvailabilityUseCase);
  container.bind<CollectResearchDataUseCase>(TYPES.CollectResearchDataUseCase).to(CollectResearchDataUseCase);
  container.bind<ResearchAssistantUseCase>(TYPES.ResearchAssistantUseCase).to(ResearchAssistantUseCase);
  container.bind<ResearchController>(TYPES.ResearchController).to(ResearchController);

  // Cross-module dependencies for synthesis are resolved at runtime
}
