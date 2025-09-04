'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import dynamic from 'next/dynamic';
import type { AudioFile, AnalysisState } from '~/lib/types';
import { audioAPI } from '~/lib/api';
import LoadingState from './LoadingState';
import Error from './Error';

// Dynamic imports for heavy client components
const FileUpload = dynamic(() => import('./FileUpload').then(mod => ({ default: mod.FileUpload })), {
  loading: () => <div className="h-32 bg-white/20 rounded-2xl animate-pulse" />
});


const AudioPlayer = dynamic(() => import('./AudioPlayer').then(mod => ({ default: mod.AudioPlayer })), {
  ssr: false,
  loading: () => <div className="h-96 bg-white/20 rounded-2xl animate-pulse" />
});

const SpectrogramVisualization = dynamic(() => import('./SpectrogramVisualization').then(mod => ({ default: mod.SpectrogramVisualization })), {
  ssr: false,
  loading: () => <div className="h-96 bg-white/20 rounded-2xl animate-pulse" />
});

const FeatureMapsVisualization = dynamic(() => import('./FeatureMapsVisualization').then(mod => ({ default: mod.FeatureMapsVisualization })), {
  ssr: false,
  loading: () => <div className="h-96 bg-white/20 rounded-2xl animate-pulse" />
});

const PredictionsDisplay = dynamic(() => import('./PredictionsDisplay').then(mod => ({ default: mod.PredictionsDisplay })), {
  ssr: false,
  loading: () => <div className="h-64 bg-white/20 rounded-2xl animate-pulse" />
});

export default function InteractiveSection() {
  const [audioFile, setAudioFile] = useState<AudioFile | null>(null);
  const [analysisState, setAnalysisState] = useState<AnalysisState>({
    isLoading: false,
    error: null,
    result: null,
    progress: 0,
  });

  const handleFileSelect = async (file: AudioFile) => {
    setAudioFile(file);
    setAnalysisState(prev => ({ ...prev, isLoading: true, error: null, progress: 0 }));

    try {
      // First try the real Modal endpoint
      const result = await audioAPI.evaluateAudio(file.file, (progress) => {
        setAnalysisState(prev => ({ ...prev, progress }));
      });
      setAnalysisState(prev => ({ ...prev, result, isLoading: false, progress: 100 }));
    } catch (error) {
      console.warn('Real API failed, falling back to mock data:', error);
      // Fallback to mock data for development
      try {
        const result = await audioAPI.getMockEvaluationResult();
        setAnalysisState(prev => ({ ...prev, result, isLoading: false, progress: 100 }));
      } catch (mockError) {
        setAnalysisState(prev => ({ 
          ...prev, 
          error: typeof mockError === 'object' && mockError !== null && 'message' in mockError 
            ? String((mockError as { message?: unknown }).message)
            : 'Analysis failed',
          isLoading: false 
        }));
      }
    }
  };

  return (
    <>
      {/* File Upload Section */}
      <motion.div id="upload-section"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: "easeOut", delay: 0.6 }}
        className="mb-16"
      >
        <div className="relative">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-purple-500/10 rounded-3xl blur-xl"></div>
          <div className="relative">
            <FileUpload 
              onFileSelect={handleFileSelect}
              isLoading={analysisState.isLoading}
            />
          </div>
        </div>
      </motion.div>

      {/* Loading State */}
      {analysisState.isLoading && (
        <LoadingState analysisState={analysisState} />
      )}

      {/* Error State */}
      {analysisState.error && (
        <Error analysisState={analysisState} />
      )}

      {/* Results Section */}
      {analysisState.result && audioFile && (
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="space-y-12"
        >
          {/* Enhanced Predictions Display */}
          <PredictionsDisplay 
            predictions={analysisState.result.predictions}
            className=""
          />

          {/* Audio Analysis Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
            {/* Audio Player with Waveform */}
            <AudioPlayer 
              audioUrl={audioFile.url}
              waveformData={analysisState.result.waveform}
              audioFile={audioFile.file}
              className=""
            />
            
            {/* Mel-Spectrogram Visualization */}
            <SpectrogramVisualization 
              data={analysisState.result.input_spectogram}
              title="Input Mel-Spectrogram"
              className=""
            />
          </div>

          {/* CNN Feature Maps Visualization */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
          >
            <FeatureMapsVisualization 
              featureMaps={analysisState.result.visualization}
              className=""
            />
          </motion.div>
        </motion.div>
      )}
    </>
  );
}
