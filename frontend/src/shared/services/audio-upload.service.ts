import { injectable, inject } from 'inversify';
import { AudioUploadPort } from './ports/audio-upload.port';
import type { HttpClientPort } from '../../infrastructure/http/ports/http-client.port';
import { API_CONFIG } from '../../infrastructure/config/api.config';
import { TYPES as ROOT_TYPES } from '../../infrastructure/bootstrap/types';

@injectable()
export class AudioUploadService implements AudioUploadPort {
  constructor(
    @inject(ROOT_TYPES.HttpClient)
    private readonly _httpClient: HttpClientPort
  ) {}

  async uploadAudio(blob: Blob, token: string, questionId: string): Promise<string> {
    const formData = new FormData();
    formData.append('audio', blob, 'audio.webm');
    formData.append('token', token);
    formData.append('questionId', questionId);

    const response = await this._httpClient.post<{ audioUrl: string }>(
      `${API_CONFIG.ENDPOINTS.SUBMIT_RESPONSE(token)}/audio`,
      formData
    );

    return response.audioUrl;
  }
}

