import { injectable, inject } from 'inversify';
import Result from '../../../../infrastructure/result/result';
import type { SurveyResponseRepositoryPort } from '../ports/survey-response-repository.port';
import { SurveyResponse } from '../../domain/entities/survey-response.entity';
import { ResponseSaveError } from '../../domain/errors/survey-response.error';
import { TYPES } from '../../infrastructure/bootstrap/types';

export type SubmitAnswerUseCaseRequest = {
  token: string;
  questionId: string;
  value: string | number;
  audioUrl?: string;
};

export type SubmitAnswerUseCaseResponse = {
  response: {
    id: string;
    questionId: string;
    value: string | number;
    timestamp: string;
  };
};

@injectable()
export class SubmitAnswerUseCase {
  constructor(
    @inject(TYPES.SurveyResponseRepository)
    private readonly _repository: SurveyResponseRepositoryPort
  ) {}

  async execute(input: SubmitAnswerUseCaseRequest): Promise<Result<SubmitAnswerUseCaseResponse, ResponseSaveError>> {
    const result = await this._repository.submitAnswer(input.token, input.questionId, input.value, input.audioUrl);

    if (!result.isSuccess) {
      return Result.failure(result.error);
    }

    const response = result.data;

    return Result.success({
      response: {
        id: response.id,
        questionId: response.questionId,
        value: response.value,
        timestamp: response.timestamp.toISOString()
      }
    });
  }
}

