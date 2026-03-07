import { container } from '../../../../infrastructure/bootstrap/container';
import { TYPES as HTTP_TYPES } from '../../../../infrastructure/bootstrap/types';
import type { HttpClientPort } from '../../../../infrastructure/http/ports/http-client.port';

export interface FeedbackItem {
  id: string;
  type: string;
  text: string;
  screenshotUrl: string | null;
  userId: string;
  authorEmail: string | null;
  authorDisplayName: string | null;
  pageUrl: string | null;
  createdAt: string;
}

export interface FeedbackAnalysis {
  summary: string;
  themes: string[];
  suggestedActions: string[];
}

export interface FeedbackViewModel {
  feedback: FeedbackItem[];
  filteredFeedback: FeedbackItem[];
  loading: boolean;
  error: string | null;
  analyzing: boolean;
  analysis: FeedbackAnalysis | null;
  analysisError: string | null;
  typeFilter: string;
}

export class FeedbackPresenter {
  private _httpClient: HttpClientPort;

  constructor() {
    this._httpClient = container.get<HttpClientPort>(HTTP_TYPES.HttpClient);
  }

  private viewModel: FeedbackViewModel = {
    feedback: [],
    filteredFeedback: [],
    loading: true,
    error: null,
    analyzing: false,
    analysis: null,
    analysisError: null,
    typeFilter: '',
  };

  private listeners: Set<(viewModel: FeedbackViewModel) => void> = new Set();

  getViewModel(): FeedbackViewModel {
    return { ...this.viewModel };
  }

  subscribe(listener: (viewModel: FeedbackViewModel) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notifyListeners(): void {
    const viewModel = this.getViewModel();
    this.listeners.forEach(listener => listener(viewModel));
  }

  private updateViewModel(updates: Partial<FeedbackViewModel>): void {
    this.viewModel = { ...this.viewModel, ...updates };
    this.updateFilteredFeedback();
    this.notifyListeners();
  }

  private updateFilteredFeedback(): void {
    let filtered = [...this.viewModel.feedback];

    if (this.viewModel.typeFilter) {
      filtered = filtered.filter(f => f.type === this.viewModel.typeFilter);
    }

    // Sort by type order, then by date
    const TYPE_ORDER: Record<string, number> = {
      feature_request: 0,
      bug_report: 1,
      what_is_missing: 2,
      other: 3,
    };

    filtered.sort((a, b) => {
      const typeA = TYPE_ORDER[a.type] ?? 4;
      const typeB = TYPE_ORDER[b.type] ?? 4;
      if (typeA !== typeB) return typeA - typeB;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

    this.viewModel.filteredFeedback = filtered;
  }

  async loadFeedback(): Promise<void> {
    try {
      this.updateViewModel({ loading: true, error: null });

      const { API_CONFIG } = await import('../../../../infrastructure/config/api.config');
      const data = await this._httpClient.get<{ feedback: FeedbackItem[] }>(API_CONFIG.ENDPOINTS.ADMIN_FEEDBACK);

      this.updateViewModel({
        feedback: Array.isArray(data?.feedback) ? data.feedback : [],
        loading: false,
      });
    } catch (error) {
      this.updateViewModel({
        error: error instanceof Error ? error.message : 'Failed to load feedback',
        loading: false,
      });
    }
  }

  async runAnalysis(): Promise<void> {
    try {
      this.updateViewModel({
        analyzing: true,
        analysisError: null,
        analysis: null,
      });

      const { API_CONFIG } = await import('../../../../infrastructure/config/api.config');
      const data = await this._httpClient.post<{ analysis: { summary: string; themes: string[]; suggestedActions: string[] } }>(
        API_CONFIG.ENDPOINTS.ADMIN_FEEDBACK_ANALYZE
      );

      if (data?.analysis) {
        this.updateViewModel({
          analysis: {
            summary: data.analysis.summary ?? '',
            themes: Array.isArray(data.analysis.themes) ? data.analysis.themes : [],
            suggestedActions: Array.isArray(data.analysis.suggestedActions) ? data.analysis.suggestedActions : [],
          },
          analyzing: false,
        });
      } else {
        this.updateViewModel({
          analyzing: false,
          analysisError: 'No analysis data received',
        });
      }
    } catch (error) {
      this.updateViewModel({
        analysisError: error instanceof Error ? error.message : 'Analysis request failed',
        analyzing: false,
      });
    }
  }

  setTypeFilter(filter: string): void {
    this.updateViewModel({ typeFilter: filter });
  }

  // Helper methods for formatting
  getAuthorLabel(f: FeedbackItem): string {
    if (f.authorDisplayName?.trim()) return f.authorDisplayName.trim();
    if (f.authorEmail?.trim()) return f.authorEmail.trim();
    return this.idShort(f.userId);
  }

  getTypeLabel(type: string): string {
    const labels: Record<string, string> = {
      feature_request: 'New feature',
      bug_report: 'Bug report',
      what_is_missing: "What's missing",
      other: 'Other',
    };
    return labels[type] ?? type;
  }

  formatDate(iso: string): string {
    try {
      const d = new Date(iso);
      return d.toLocaleDateString(undefined, {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return iso;
    }
  }

  idShort(id: string): string {
    if (id.length <= 8) return id;
    return `${id.slice(0, 4)}…${id.slice(-4)}`;
  }
}

// Factory function for creating presenter instance
export function createFeedbackPresenter(): FeedbackPresenter {
  return new FeedbackPresenter();
}