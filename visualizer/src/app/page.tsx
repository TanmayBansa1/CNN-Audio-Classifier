'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { FileUpload } from '~/components/FileUpload';
import { AudioPlayer } from '~/components/AudioPlayer';
import { SpectrogramVisualization } from '~/components/SpectrogramVisualization';
import { FeatureMapsVisualization } from '~/components/FeatureMapsVisualization';
import { PredictionsDisplay } from '~/components/PredictionsDisplay';
import type { AudioFile, AnalysisState } from '~/lib/types';
import { audioAPI } from '~/lib/api';
import Image from 'next/image';

export default function HomePage() {
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
          error: mockError instanceof Error ? mockError.message : 'Analysis failed',
          isLoading: false 
        }));
      }
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Header */}
      <header className="border-b border-white/10 bg-black/20 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex items-center space-x-3"
            >
              <div className="bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                <Image src="/logo.png" alt="SunoAI" width={80} height={80} className='rounded-lg'/>
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white">SunoAI</h1>
                <p className="text-sm text-gray-300">Audio CNN Visualizer</p>
              </div>
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="text-right"
            >
              <p className="text-xs text-gray-400">50 Audio Classes • ESC-50 Dataset</p>
            </motion.div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-12">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-4xl font-bold text-white mb-4"
          >
            Professional Audio Analysis
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-xl text-gray-300 max-w-3xl mx-auto"
          >
            Upload your audio file to see real-time CNN feature maps, spectrograms, 
            and classification results from our ResNet-based audio classifier.
          </motion.p>
        </div>

        {/* File Upload Section */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mb-12"
        >
          <FileUpload 
            onFileSelect={handleFileSelect}
            isLoading={analysisState.isLoading}
          />
        </motion.div>

        {/* Loading State */}
        {analysisState.isLoading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-12"
          >
            <div className="inline-flex items-center space-x-3">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
              <span className="text-white text-lg">Analyzing audio with SunoAI...</span>
            </div>
            <div className="mt-4 max-w-md mx-auto bg-gray-800 rounded-full h-2">
              <div 
                className="bg-gradient-to-r from-blue-500 to-purple-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${analysisState.progress}%` }}
              />
            </div>
          </motion.div>
        )}

        {/* Error State */}
        {analysisState.error && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-12"
          >
            <div className="bg-red-900/50 border border-red-500/50 rounded-lg p-6 max-w-md mx-auto">
              <p className="text-red-200">Analysis failed: {analysisState.error}</p>
            </div>
          </motion.div>
        )}

        {/* Results Section */}
        {analysisState.result && audioFile && (
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-8"
          >
            {/* Enhanced Predictions Display */}
            <PredictionsDisplay 
              predictions={analysisState.result.predictions}
              className=""
            />

            {/* Audio Analysis Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Audio Player with Waveform */}
              <AudioPlayer 
                audioUrl={audioFile.url}
                waveformData={analysisState.result.waveform}
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
            <FeatureMapsVisualization 
              featureMaps={analysisState.result.visualization}
              className=""
            />
          </motion.div>
        )}
      </main>
    </div>
  );
}
