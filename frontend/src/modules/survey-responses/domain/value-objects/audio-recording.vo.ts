export class AudioRecording {
  constructor(
    public readonly blob: Blob,
    public readonly duration: number,
    public readonly format: string
  ) {
    if (duration < 0) {
      throw new Error('Audio duration cannot be negative');
    }
    if (!format || format.trim().length === 0) {
      throw new Error('Audio format cannot be empty');
    }
  }

  equals(other: AudioRecording): boolean {
    return (
      this.blob === other.blob &&
      this.duration === other.duration &&
      this.format === other.format
    );
  }
}

