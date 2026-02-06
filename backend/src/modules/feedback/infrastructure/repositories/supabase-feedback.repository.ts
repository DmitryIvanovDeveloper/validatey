import { injectable, inject } from 'inversify';
import { TYPES as ROOT_TYPES } from '../../../../infrastructure/bootstrap/types';
import { LoggerPort } from '../../../../infrastructure/logging/ports/logger.port';
import ResultEx from '../../../../infrastructure/result/result';
import { getSupabaseClient } from '../../../../infrastructure/database/supabase-client';
import type { Feedback } from '../../domain/entities/feedback.entity';
import type { FeedbackRepositoryPort } from '../../application/ports/feedback-repository.port';

const TABLE = 'feedback';

interface FeedbackRow {
  id: string;
  type: string;
  text: string;
  screenshot_url: string | null;
  user_id: string;
  page_url: string | null;
  created_at: string;
}

@injectable()
export class SupabaseFeedbackRepository implements FeedbackRepositoryPort {
  constructor(
    @inject(ROOT_TYPES.Logger)
    private readonly _logger: LoggerPort
  ) {}

  async save(feedback: Feedback): Promise<ResultEx<Feedback, Error>> {
    try {
      const supabase = getSupabaseClient();
      const { data, error } = await supabase
        .from(TABLE)
        .insert({
          id: feedback.id,
          type: feedback.type,
          text: feedback.text,
          screenshot_url: feedback.screenshotUrl,
          user_id: feedback.userId,
          page_url: feedback.pageUrl,
          created_at: feedback.createdAt.toISOString(),
        })
        .select()
        .single();

      if (error) {
        this._logger.error('supabase-feedback-repository.save-error', { error });
        return ResultEx.failure(new Error(error.message));
      }
      return ResultEx.success(this.mapToDomain(data as FeedbackRow));
    } catch (err) {
      this._logger.error('supabase-feedback-repository.save-exception', { error: err });
      return ResultEx.failure(err instanceof Error ? err : new Error('Unknown error'));
    }
  }

  async list(): Promise<ResultEx<Feedback[], Error>> {
    try {
      const supabase = getSupabaseClient();
      const { data, error } = await supabase
        .from(TABLE)
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        this._logger.error('supabase-feedback-repository.list-error', { error });
        return ResultEx.failure(new Error(error.message));
      }
      return ResultEx.success((data || []).map((row: FeedbackRow) => this.mapToDomain(row)));
    } catch (err) {
      this._logger.error('supabase-feedback-repository.list-exception', { error: err });
      return ResultEx.failure(err instanceof Error ? err : new Error('Unknown error'));
    }
  }

  private mapToDomain(row: FeedbackRow): Feedback {
    return {
      id: row.id,
      type: row.type as Feedback['type'],
      text: row.text,
      screenshotUrl: row.screenshot_url,
      userId: row.user_id,
      pageUrl: row.page_url,
      createdAt: new Date(row.created_at),
    };
  }
}
