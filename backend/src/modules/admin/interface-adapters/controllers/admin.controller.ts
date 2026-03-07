import { injectable, inject } from 'inversify';
import 'reflect-metadata';
import { TYPES } from '../../infrastructure/bootstrap/types';
import { ListUsersUseCase } from '../../application/use-cases/list-users.use-case';
import { ListWishlistUseCase } from '../../../wishlist/application/use-cases/list-wishlist.use-case';
import { ListFeedbackUseCase } from '../../../feedback/application/use-cases/list-feedback.use-case';
import { AnalyzeFeedbackUseCase } from '../../../feedback/application/use-cases/analyze-feedback.use-case';
import { TYPES as WISHLIST_TYPES } from '../../../wishlist/application/types';
import { TYPES as FEEDBACK_TYPES } from '../../../feedback/infrastructure/bootstrap/types';

export interface AdminUser {
  id: string;
  email: string | null;
  displayName: string | null;
}

export interface AdminWishlistEntry {
  id: string;
  email: string;
  createdAt: Date;
}

export interface AdminFeedbackItem {
  id: string;
  type: string;
  text: string;
  screenshotUrl: string | null;
  userId: string | null;
  authorEmail: string | null;
  authorDisplayName: string | null;
  pageUrl: string | null;
  createdAt: Date;
}

@injectable()
export class AdminController {
  constructor(
    @inject(TYPES.ListUsersUseCase)
    private readonly _listUsersUseCase: ListUsersUseCase,
    @inject(WISHLIST_TYPES.ListWishlistUseCase)
    private readonly _listWishlistUseCase: ListWishlistUseCase,
    @inject(FEEDBACK_TYPES.ListFeedbackUseCase)
    private readonly _listFeedbackUseCase: ListFeedbackUseCase,
    @inject(FEEDBACK_TYPES.AnalyzeFeedbackUseCase)
    private readonly _analyzeFeedbackUseCase: AnalyzeFeedbackUseCase
  ) {}

  async listUsers(callerUserId: string): Promise<{ users: AdminUser[] }> {
    const result = await this._listUsersUseCase.execute({ callerUserId });
    if (!result.isSuccess) {
      throw result.error;
    }
    return result.data;
  }

  async listWishlist(callerUserId: string): Promise<{ wishlist: AdminWishlistEntry[] }> {
    const result = await this._listWishlistUseCase.execute({ callerUserId });
    if (!result.isSuccess) {
      throw result.error;
    }
    return result.data;
  }

  async listFeedback(callerUserId: string): Promise<{ feedback: AdminFeedbackItem[] }> {
    const feedbackResult = await this._listFeedbackUseCase.execute({ callerUserId });
    if (!feedbackResult.isSuccess) {
      throw feedbackResult.error;
    }

    // Получаем всех пользователей для маппинга email/displayName
    const usersResult = await this._listUsersUseCase.execute({ callerUserId });
    const userMap = new Map<string, { email: string | null; displayName: string | null }>();
    if (usersResult.isSuccess && usersResult.data.users) {
      for (const u of usersResult.data.users) {
        userMap.set(u.id, { email: u.email ?? null, displayName: u.displayName ?? null });
      }
    }

    const author = (userId: string | null) =>
      userId ? (userMap.get(userId) ?? { email: null, displayName: null }) : { email: null, displayName: null };

    const feedback = feedbackResult.data.feedback.map((f) => {
      const { email, displayName } = author(f.userId);
      return {
        id: f.id,
        type: f.type,
        text: f.text,
        screenshotUrl: f.screenshotUrl,
        userId: f.userId,
        authorEmail: email,
        authorDisplayName: displayName,
        pageUrl: f.pageUrl,
        createdAt: f.createdAt,
      };
    });

    return { feedback };
  }

  async analyzeFeedback(callerUserId: string): Promise<{ analysis: any }> {
    const result = await this._analyzeFeedbackUseCase.execute({ callerUserId });
    if (!result.isSuccess) {
      throw result.error;
    }
    return { analysis: result.data.analysis };
  }
}