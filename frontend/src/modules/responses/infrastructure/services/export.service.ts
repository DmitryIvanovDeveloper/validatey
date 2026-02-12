import { injectable, inject } from 'inversify';
import type { ExportServicePort } from '../../application/ports/export-service.port';
import type { HttpClientPort } from '../../../../infrastructure/http/ports/http-client.port';
import { API_CONFIG } from '../../../../infrastructure/config/api.config';
import { TYPES as ROOT_TYPES } from '../../../../infrastructure/bootstrap/types';

@injectable()
export class ExportService implements ExportServicePort {
  constructor(
    @inject(ROOT_TYPES.HttpClient)
    private readonly _httpClient: HttpClientPort
  ) {}

  async exportResponses(projectId: string, format: 'json' | 'csv'): Promise<{ data: Blob; error?: string }> {
    try {
      const response = await this._httpClient.get(
        API_CONFIG.ENDPOINTS.RESPONSES_EXPORT(projectId, format),
        { responseType: 'blob' }
      ) as Blob;

      return { data: response };
    } catch (error) {
      return {
        data: new Blob(),
        error: error instanceof Error ? error.message : 'Failed to export responses',
      };
    }
  }

  async exportConsents(projectId: string, format: 'json' | 'csv'): Promise<{ data: Blob; error?: string }> {
    try {
      const response = await this._httpClient.get(
        API_CONFIG.ENDPOINTS.CONSENTS_EXPORT(projectId, format),
        { responseType: 'blob' }
      ) as Blob;

      return { data: response };
    } catch (error) {
      return {
        data: new Blob(),
        error: error instanceof Error ? error.message : 'Failed to export consents',
      };
    }
  }
}