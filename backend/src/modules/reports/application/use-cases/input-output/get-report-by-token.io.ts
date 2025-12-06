import { Report } from '../../../domain/entities/report.entity';

export type GetReportByTokenUseCaseRequest = {
  token: string;
};

export type GetReportByTokenUseCaseResponse = {
  report: Report;
};

