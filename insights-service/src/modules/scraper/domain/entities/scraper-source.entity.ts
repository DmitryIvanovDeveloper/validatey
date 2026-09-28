import { randomUUID } from "crypto";
import type { ScraperSourceType } from "../value-objects/scraper-source-type.vo";
import type { ScheduleFrequency } from "../value-objects/schedule-frequency.vo";
import type { CustomSelectors } from "../value-objects/custom-selectors.vo";
import type { ResearchGoal } from "../value-objects/research-goal.vo";
import { InvalidScraperConfigError } from "../errors/scraper.error";
import { isScraperSourceType } from "../value-objects/scraper-source-type.vo";
import { isScheduleFrequency } from "../value-objects/schedule-frequency.vo";

export type AiProcessingOption = "analyze_trends" | "compare_with_us" | "none";

export interface ScraperSource {
  readonly id: string;
  readonly projectId: string;
  readonly type: ScraperSourceType;
  readonly name: string | null;
  readonly researchGoal: ResearchGoal | null;
  readonly urls: readonly string[];
  readonly whatToCollect: readonly string[];
  readonly frequency: ScheduleFrequency;
  readonly aiProcessing: AiProcessingOption;
  readonly customSelectors: CustomSelectors | null;
  readonly stopOnFirstError: boolean;
  readonly createdAt: Date;
  readonly updatedAt: Date;
}

interface CreateScraperSourceParams {
  projectId: string;
  type: ScraperSourceType;
  name?: string | null;
  researchGoal?: ResearchGoal | null;
  urls: string[];
  whatToCollect: string[];
  frequency: ScheduleFrequency;
  aiProcessing?: AiProcessingOption;
  customSelectors?: CustomSelectors | null;
  stopOnFirstError?: boolean;
}

function isValidUrl(s: string): boolean {
  try {
    const u = new URL(s);
    return u.protocol === "http:" || u.protocol === "https:";
  } catch {
    return false;
  }
}

export class ScraperSourceEntity {
  static create(params: CreateScraperSourceParams): ScraperSourceEntity {
    if (!params.projectId?.trim()) throw new InvalidScraperConfigError("projectId is required");
    if (!isScraperSourceType(params.type)) throw new InvalidScraperConfigError(`Invalid type: ${params.type}`);
    if (!Array.isArray(params.urls) || params.urls.length === 0) {
      throw new InvalidScraperConfigError("At least one URL is required");
    }
    const urls = params.urls.filter((u) => typeof u === "string" && u.trim()).map((u) => u.trim());
    if (urls.length === 0) throw new InvalidScraperConfigError("At least one valid URL is required");
    for (const u of urls) if (!isValidUrl(u)) throw new InvalidScraperConfigError(`Invalid URL: ${u}`);
    if (!Array.isArray(params.whatToCollect)) throw new InvalidScraperConfigError("whatToCollect must be an array");
    if (!isScheduleFrequency(params.frequency)) {
      throw new InvalidScraperConfigError(`Invalid frequency: ${params.frequency}`);
    }
    const aiProcessing = params.aiProcessing ?? "none";
    const validAi: AiProcessingOption[] = ["analyze_trends", "compare_with_us", "none"];
    if (!validAi.includes(aiProcessing)) {
      throw new InvalidScraperConfigError(`Invalid aiProcessing: ${aiProcessing}`);
    }
    const customSelectors = params.type === "custom" && params.customSelectors ? params.customSelectors : null;
    if (params.type === "custom" && !customSelectors) {
      throw new InvalidScraperConfigError('Custom selectors are required for type "custom"');
    }
    const now = new Date();
    return new ScraperSourceEntity(
      randomUUID(),
      params.projectId.trim(),
      params.type,
      params.name?.trim() ?? null,
      params.researchGoal ?? null,
      urls,
      params.whatToCollect.map((s) => String(s).trim()).filter(Boolean),
      params.frequency,
      aiProcessing,
      customSelectors,
      params.stopOnFirstError ?? true,
      now,
      now,
    );
  }

  static merge(
    existing: ScraperSource,
    update: Partial<
      Pick<
        ScraperSource,
        "name" | "researchGoal" | "urls" | "whatToCollect" | "frequency" | "aiProcessing" | "customSelectors" | "stopOnFirstError"
      >
    >,
  ): ScraperSourceEntity {
    return new ScraperSourceEntity(
      existing.id,
      existing.projectId,
      existing.type,
      update.name !== undefined ? update.name : existing.name,
      update.researchGoal !== undefined ? update.researchGoal : existing.researchGoal,
      update.urls !== undefined ? update.urls : existing.urls,
      update.whatToCollect !== undefined ? update.whatToCollect : existing.whatToCollect,
      update.frequency !== undefined ? update.frequency : existing.frequency,
      update.aiProcessing !== undefined ? update.aiProcessing : existing.aiProcessing,
      update.customSelectors !== undefined ? update.customSelectors : existing.customSelectors,
      update.stopOnFirstError !== undefined ? update.stopOnFirstError : existing.stopOnFirstError,
      existing.createdAt,
      new Date(),
    );
  }

  private constructor(
    public readonly id: string,
    public readonly projectId: string,
    public readonly type: ScraperSourceType,
    public readonly name: string | null,
    public readonly researchGoal: ResearchGoal | null,
    public readonly urls: readonly string[],
    public readonly whatToCollect: readonly string[],
    public readonly frequency: ScheduleFrequency,
    public readonly aiProcessing: AiProcessingOption,
    public readonly customSelectors: CustomSelectors | null,
    public readonly stopOnFirstError: boolean,
    public readonly createdAt: Date,
    public readonly updatedAt: Date,
  ) {}

  toData(): ScraperSource {
    return {
      id: this.id,
      projectId: this.projectId,
      type: this.type,
      name: this.name,
      researchGoal: this.researchGoal,
      urls: [...this.urls],
      whatToCollect: [...this.whatToCollect],
      frequency: this.frequency,
      aiProcessing: this.aiProcessing,
      customSelectors: this.customSelectors,
      stopOnFirstError: this.stopOnFirstError,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }
}
