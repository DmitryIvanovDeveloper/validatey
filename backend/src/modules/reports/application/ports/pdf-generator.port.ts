import ResultEx from '../../../../infrastructure/result/result';
import { ReportGenerationError } from '../../domain/errors/report.error';

export interface GeneratePDFRequest {
  htmlContent: string;
  filename?: string;
}

export interface GeneratePDFResponse {
  pdfUrl: string;
  filePath: string;
}

export interface PDFGeneratorPort {
  generatePDF(request: GeneratePDFRequest): Promise<ResultEx<GeneratePDFResponse, ReportGenerationError>>;
}



