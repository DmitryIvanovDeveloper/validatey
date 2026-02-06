import { Container } from 'inversify';
import { TYPES } from './types';
import { ResearchDataRepositoryPort } from '../../application/ports/research-data-repository.port';
import type { SynthesisLlmPort } from '../../application/ports/synthesis-llm.port';
import type { MarketDataProviderPort } from '../../application/ports/market-data-provider.port';
import type { CompetitorDataProviderPort } from '../../application/ports/competitor-data-provider.port';
import type { AutocompleteDataProviderPort } from '../../application/ports/autocomplete-data-provider.port';
import type { SearchPhrasesGeneratorPort } from '../../application/ports/search-phrases-generator.port';
import type { AutocompleteApiPort } from '../../application/ports/autocomplete-api.port';
import type { ResearchAssistantLlmPort } from '../../application/ports/research-assistant-llm.port';
import { GetResearchCanvasUseCase } from '../../application/use-cases/get-research-canvas.use-case';
import { GenerateSynthesisUseCase } from '../../application/use-cases/generate-synthesis.use-case';
import { CollectResearchDataUseCase } from '../../application/use-cases/collect-research-data.use-case';
import { ResearchAssistantUseCase } from '../../application/use-cases/research-assistant.use-case';
import { SupabaseResearchRepository } from '../repositories/supabase-research.repository';
import { SynthesisLlmAdapter } from '../services/synthesis-llm.adapter';
import { ResearchAssistantLlmAdapter } from '../services/research-assistant-llm.adapter';
import { MarketDataProviderStubAdapter } from '../services/market-data-provider-stub.adapter';
import { CompetitorDataProviderStubAdapter } from '../services/competitor-data-provider-stub.adapter';
import { LlmMarketDataProviderAdapter } from '../services/llm-market-data-provider.adapter';
import { LlmCompetitorDataProviderAdapter } from '../services/llm-competitor-data-provider.adapter';
import { LlmSearchPhrasesGeneratorAdapter } from '../services/llm-search-phrases-generator.adapter';
import { GooglePlaceAutocompleteAdapter } from '../services/google-place-autocomplete.adapter';
import { AutocompleteDataProviderAdapter } from '../services/autocomplete-data-provider.adapter';
import { ResearchController } from '../../interface-adapters/controllers/research.controller';

const useLlmResearchProviders = !!process.env.SERPER_API_KEY?.trim();

export function bindResearch(container: Container): void {
  container.bind<ResearchDataRepositoryPort>(TYPES.ResearchDataRepository).to(SupabaseResearchRepository);
  container.bind<SynthesisLlmPort>(TYPES.SynthesisLlm).to(SynthesisLlmAdapter);
  container.bind<ResearchAssistantLlmPort>(TYPES.ResearchAssistantLlm).to(ResearchAssistantLlmAdapter);
  container
    .bind<MarketDataProviderPort>(TYPES.MarketDataProvider)
    .to(useLlmResearchProviders ? LlmMarketDataProviderAdapter : MarketDataProviderStubAdapter);
  container
    .bind<CompetitorDataProviderPort>(TYPES.CompetitorDataProvider)
    .to(useLlmResearchProviders ? LlmCompetitorDataProviderAdapter : CompetitorDataProviderStubAdapter);
  container.bind<SearchPhrasesGeneratorPort>(TYPES.SearchPhrasesGenerator).to(LlmSearchPhrasesGeneratorAdapter);
  container.bind<AutocompleteApiPort>(TYPES.AutocompleteApi).to(GooglePlaceAutocompleteAdapter);
  container.bind<AutocompleteDataProviderPort>(TYPES.AutocompleteDataProvider).to(AutocompleteDataProviderAdapter);
  container.bind<GetResearchCanvasUseCase>(TYPES.GetResearchCanvasUseCase).to(GetResearchCanvasUseCase);
  container.bind<GenerateSynthesisUseCase>(TYPES.GenerateSynthesisUseCase).to(GenerateSynthesisUseCase);
  container.bind<CollectResearchDataUseCase>(TYPES.CollectResearchDataUseCase).to(CollectResearchDataUseCase);
  container.bind<ResearchAssistantUseCase>(TYPES.ResearchAssistantUseCase).to(ResearchAssistantUseCase);
  container.bind<ResearchController>(TYPES.ResearchController).to(ResearchController);
}
