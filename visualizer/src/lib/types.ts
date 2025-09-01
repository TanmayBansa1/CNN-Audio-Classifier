// Types for the Audio CNN Visualizer

export interface Prediction {
  class: string;
  confidence: number;
}

export interface VisualizationData {
  shape: number[];
  values: number[][];
}

export interface WaveformData {
  values: number[];
  sample_rate: number;
  duration: number;
}

export interface SpectrogramData {
  shape: number[];
  values: number[][];
}

export interface FeatureMap {
  shape: number[];
  values: number[][];
}

export interface EvaluationResult {
  predictions: Prediction[];
  visualization: Record<string, FeatureMap>;
  input_spectogram: SpectrogramData;
  waveform: WaveformData;
}

export interface AudioFile {
  file: File;
  url: string;
  name: string;
  size: number;
  duration?: number;
}

export interface AnalysisState {
  isLoading: boolean;
  error: string | null;
  result: EvaluationResult | null;
  progress: number;
}

