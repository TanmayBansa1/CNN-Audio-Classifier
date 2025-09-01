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
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    return {
      predictions: [
        { class: "dog_bark", confidence: 0.892 },
        { class: "cat_meow", confidence: 0.067 },
        { class: "bird_singing", confidence: 0.041 }
      ],
      visualization: {
        "layer1": {
          shape: [64, 64],
          values: Array(64).fill(0).map(() => 
            Array(64).fill(0).map(() => Math.random() * 2 - 1)
          )
        },
        "layer2": {
          shape: [32, 32],
          values: Array(32).fill(0).map(() => 
            Array(32).fill(0).map(() => Math.random() * 2 - 1)
          )
        },
        "layer3": {
          shape: [16, 16],
          values: Array(16).fill(0).map(() => 
            Array(16).fill(0).map(() => Math.random() * 2 - 1)
          )
        }
      },
      input_spectogram: {
        shape: [128, 216],
        values: Array(128).fill(0).map(() => 
          Array(216).fill(0).map(() => Math.random() * 80 - 80)
        )
      },
      waveform: {
        values: Array(8000).fill(0).map(() => Math.random() * 2 - 1),
        sample_rate: 44100,
        duration: 5.0
      }
    };
  }
}

export const audioAPI = AudioAnalysisAPI.getInstance();
