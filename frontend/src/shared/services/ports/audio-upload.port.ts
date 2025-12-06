export interface AudioUploadPort {
  uploadAudio(blob: Blob, token: string, questionId: string): Promise<string>; // Returns audioUrl
}

