import { Container } from 'inversify';
import { TYPES } from './types';
import type { ScraperApiPort } from '../../application/ports/scraper-api.port';
import { ScraperApiRepository } from '../repositories/scraper-api.repository';
import { ScraperPresenter } from '../../interface-adapters/presenters/scraper.presenter';

export function bindScraper(container: Container): void {
  container.bind<ScraperApiPort>(TYPES.ScraperApi).to(ScraperApiRepository);
  container.bind<ScraperPresenter>(TYPES.ScraperPresenter).to(ScraperPresenter);
}
