import { Report } from '../../../domain/entities/report.entity';

export type GenerateReportUseCaseRequest = {
  projectId: string;
  includePDF?: boolean;
};

export type GenerateReportUseCaseResponse = {
  report: Report;
};



