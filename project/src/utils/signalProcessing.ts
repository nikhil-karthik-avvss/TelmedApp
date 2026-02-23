import { SignalData } from '../types/telemedicine';

export interface RawMetrics {
  averageIntensity: number;
  redChannel: number;
  greenChannel: number;
  blueChannel: number;
  motionScore: number;
  timestamp: number;
}

export class SignalProcessor {
  private previousFrame: ImageData | null = null;
  private signalBuffer: number[] = [];
  private readonly BUFFER_SIZE = 100;

  extractRawMetrics(imageData: ImageData): RawMetrics {
    const data = imageData.data;
    const pixelCount = data.length / 4;

    let redSum = 0;
    let greenSum = 0;
    let blueSum = 0;
    let totalIntensity = 0;

    for (let i = 0; i < data.length; i += 4) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];

      redSum += r;
      greenSum += g;
      blueSum += b;
      totalIntensity += (r + g + b) / 3;
    }

    const avgRed = redSum / pixelCount;
    const avgGreen = greenSum / pixelCount;
    const avgBlue = blueSum / pixelCount;
    const avgIntensity = totalIntensity / pixelCount;

    const motionScore = this.calculateMotion(imageData);

    return {
      averageIntensity: avgIntensity,
      redChannel: avgRed,
      greenChannel: avgGreen,
      blueChannel: avgBlue,
      motionScore,
      timestamp: Date.now(),
    };
  }

  private calculateMotion(currentFrame: ImageData): number {
    if (!this.previousFrame) {
      this.previousFrame = currentFrame;
      return 0;
    }

    const current = currentFrame.data;
    const previous = this.previousFrame.data;
    let diffSum = 0;

    const sampleRate = 10;
    for (let i = 0; i < current.length; i += 4 * sampleRate) {
      const rDiff = Math.abs(current[i] - previous[i]);
      const gDiff = Math.abs(current[i + 1] - previous[i + 1]);
      const bDiff = Math.abs(current[i + 2] - previous[i + 2]);
      diffSum += (rDiff + gDiff + bDiff) / 3;
    }

    this.previousFrame = currentFrame;
    const avgDiff = diffSum / (current.length / (4 * sampleRate));

    return Math.min(avgDiff / 50, 1);
  }

  extractPPGSignal(metrics: RawMetrics): number {
    return metrics.greenChannel;
  }

  smoothSignal(rawValue: number): number {
    this.signalBuffer.push(rawValue);

    if (this.signalBuffer.length > this.BUFFER_SIZE) {
      this.signalBuffer.shift();
    }

    if (this.signalBuffer.length === 0) return rawValue;

    const sum = this.signalBuffer.reduce((acc, val) => acc + val, 0);
    return sum / this.signalBuffer.length;
  }

  filterSignal(signal: number): number {
    return signal;
  }

  normalizeSignal(signal: number, min: number = 0, max: number = 255): number {
    if (max === min) return 0;
    return ((signal - min) / (max - min)) * 100;
  }

  detectHeartRate(signalData: SignalData[]): number | null {
    if (signalData.length < 50) return null;

    return null;
  }

  clearBuffer(): void {
    this.signalBuffer = [];
    this.previousFrame = null;
  }
}
