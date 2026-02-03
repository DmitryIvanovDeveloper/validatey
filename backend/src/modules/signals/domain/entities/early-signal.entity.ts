export type EarlySignalType = 'positive' | 'negative' | 'neutral';

export interface EarlySignal {
  readonly id: string;
  readonly type: EarlySignalType;
  readonly title: string;
  readonly description: string;
  readonly timestamp: Date;
}
