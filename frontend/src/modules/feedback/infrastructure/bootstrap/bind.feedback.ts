import { Container } from 'inversify';
import { TYPES } from './types';
import { FeedbackPresenter } from '../../interface-adapters/presenters/feedback.presenter';

export function bindFeedback(container: Container): void {
  // Presenter - only frontend component, no backend dependencies
  container.bind<FeedbackPresenter>(TYPES.FeedbackPresenter).to(FeedbackPresenter).inSingletonScope();
}