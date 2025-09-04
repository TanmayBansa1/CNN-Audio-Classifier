// API service for Audio CNN inference

import type { EvaluationResult } from './types';

const MODAL_ENDPOINT = process.env.NEXT_PUBLIC_MODAL_ENDPOINT;

export class AudioAnalysisAPI {
  private static instance: AudioAnalysisAPI;

  static getInstance(): AudioAnalysisAPI {
    if (!AudioAnalysisAPI.instance) {
      AudioAnalysisAPI.instance = new AudioAnalysisAPI();
    }
    return AudioAnalysisAPI.instance;
  }

  async convertFileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        // Remove data URL prefix to get pure base64
        const base64 = result.split(',')[1];
        if (base64) {
          resolve(base64);
        } else {
          reject(new Error('Failed to extract base64 data'));
        }
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  async evaluateAudio(file: File, onProgress?: (progress: number) => void): Promise<EvaluationResult> {
    try {
      onProgress?.(10); // File processing started
      
      const base64Audio = await this.convertFileToBase64(file);
      onProgress?.(30); // File converted to base64
      
      const payload = {
        audio_data: base64Audio
      };

      onProgress?.(40); // Sending request
      
      // Use Modal endpoint if available, otherwise use placeholder endpoint
      const endpoint = MODAL_ENDPOINT ?? '/api/evaluate';
      
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      onProgress?.(80); // Processing response
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json() as EvaluationResult;
      onProgress?.(100); // Complete
      
      return result;
    } catch (error) {
      console.error('Error evaluating audio:', error);
      throw error;
    }
  }

  // Mock data for development/testing
  async getMockEvaluationResult(): Promise<EvaluationResult> {
    // Only generate mock data in development or when explicitly enabled
    if (process.env.NODE_ENV === 'production' && !process.env.NEXT_PUBLIC_ENABLE_MOCK_DATA) {
      throw new Error('Mock data is disabled in production. Set NEXT_PUBLIC_ENABLE_MOCK_DATA=true to enable.');
    }

    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Use smaller, more realistic mock data sizes
    const smallVisualization = this.generateSmallMockVisualization();
    const smallSpectrogram = this.generateSmallMockSpectrogram();
    const smallWaveform = this.generateSmallMockWaveform();
    
    return {
      predictions: [
        { class: "dog_bark", confidence: 0.892 },
        { class: "cat_meow", confidence: 0.067 },
        { class: "bird_singing", confidence: 0.041 }
      ],
      visualization: smallVisualization,
      input_spectogram: smallSpectrogram,
      waveform: smallWaveform
    };
  }

  private generateSmallMockVisualization() {
    // Much smaller mock data - only generate what's needed for UI testing
    const isDev = process.env.NODE_ENV === 'development';
    const size1 = isDev ? 16 : 8; // Reduced from 64
    const size2 = isDev ? 12 : 6; // Reduced from 32  
    const size3 = isDev ? 8 : 4;  // Reduced from 16

    return {
      "layer1": {
        shape: [size1, size1],
        values: Array(size1).fill(0).map(() => 
          Array(size1).fill(0).map(() => Math.random() * 2 - 1)
        )
      },
      "layer2": {
        shape: [size2, size2],
        values: Array(size2).fill(0).map(() => 
          Array(size2).fill(0).map(() => Math.random() * 2 - 1)
        )
      },
      "layer3": {
        shape: [size3, size3],
        values: Array(size3).fill(0).map(() => 
          Array(size3).fill(0).map(() => Math.random() * 2 - 1)
        )
      }
    };
  }

  private generateSmallMockSpectrogram() {
    const isDev = process.env.NODE_ENV === 'development';
    const freqBins = isDev ? 64 : 32; // Reduced from 128
    const timeBins = isDev ? 108 : 54; // Reduced from 216

    return {
      shape: [freqBins, timeBins],
      values: Array(freqBins).fill(0).map(() => 
        Array(timeBins).fill(0).map(() => Math.random() * 80 - 80)
      )
    };
  }

  private generateSmallMockWaveform() {
    const isDev = process.env.NODE_ENV === 'development';
    const samples = isDev ? 4000 : 2000; // Reduced from 8000

    return {
      values: Array(samples).fill(0).map(() => Math.random() * 2 - 1),
      sample_rate: 44100,
      duration: 5.0
    };
  }
}

export const audioAPI = AudioAnalysisAPI.getInstance();
