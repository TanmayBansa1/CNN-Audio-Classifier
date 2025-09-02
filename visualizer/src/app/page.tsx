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
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-rose-50 to-amber-50 relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-gradient-to-r from-orange-200/30 via-rose-200/30 to-amber-200/30 animate-gradient-x"></div>
        <div className="absolute top-0 left-1/4 w-72 h-72 bg-rose-300/20 rounded-full filter blur-3xl animate-pulse"></div>
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-orange-300/15 rounded-full filter blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-gradient-conic from-transparent via-rose-300/8 to-transparent rounded-full animate-spin-slow"></div>
      </div>
      
      {/* Header */}
      <header className="relative z-10 border-b border-orange-200/30 bg-white/40 backdrop-blur-xl shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, ease: "easeOut" }}
              className="flex items-center space-x-4"
            >
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-rose-300 to-orange-400 rounded-2xl blur-lg opacity-60 animate-pulse"></div>
                <div className="relative bg-gradient-to-br from-rose-400 to-orange-400 rounded-2xl p-1 shadow-lg">
                  <Image src="/logo.png" alt="SunoAI" width={56} height={56} className='rounded-xl'/>
                </div>
              </div>
              <div>
                <h1 className="text-2xl font-playfair font-medium bg-gradient-to-r from-rose-700 via-orange-600 to-amber-600 bg-clip-text text-transparent">
                  SunoAI
                </h1>
                <p className="text-sm font-crimson text-rose-600/70 italic">Audio CNN Visualizer</p>
              </div>
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, ease: "easeOut", delay: 0.1 }}
              className="text-right"
            >
              <div className="bg-white/60 backdrop-blur-sm rounded-xl px-4 py-2 border border-orange-200/50 shadow-sm">
                <p className="text-xs font-medium text-orange-700">50 Audio Classes</p>
                <p className="text-xs text-rose-600/60">ESC-50 Dataset</p>
              </div>
            </motion.div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="mb-8"
          >
            <div className="inline-flex items-center px-4 py-2 rounded-full bg-gradient-to-r from-rose-200/40 to-orange-200/40 border border-rose-300/40 backdrop-blur-sm mb-6">
              <span className="text-sm font-crimson text-rose-700">🎵 AI-Powered Audio Analysis</span>
            </div>
            <h2 className="text-4xl md:text-5xl font-playfair font-medium mb-6 leading-tight">
              <span className="bg-gradient-to-r from-rose-800 via-orange-700 to-amber-700 bg-clip-text text-transparent">
                Don&apos;t just hear it
              </span>
              <br />
              <span className="bg-gradient-to-r from-orange-700 via-rose-700 to-pink-700 bg-clip-text text-transparent italic">
                Listen to It!
              </span>
            </h2>
          </motion.div>
          
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut", delay: 0.2 }}
            className="text-lg md:text-xl text-gray-700 max-w-4xl mx-auto leading-relaxed font-crimson"
          >
            Upload your audio file to witness{" "}
            <span className="text-transparent bg-gradient-to-r from-rose-600 to-orange-600 bg-clip-text font-semibold italic">
              real-time CNN feature maps
            </span>
            , interactive spectrograms, and intelligent classification results from our refined{" "}
            <span className="text-transparent bg-gradient-to-r from-orange-600 to-amber-600 bg-clip-text font-semibold italic">
              ResNet-based audio classifier
            </span>
            .
          </motion.p>
          
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut", delay: 0.4 }}
            className="flex flex-wrap justify-center gap-6 mt-12 text-sm text-gray-600"
          >
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
              <span className="font-crimson">Real-time Processing</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-rose-500 rounded-full animate-pulse delay-200"></div>
              <span className="font-crimson">CNN Visualization</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-orange-500 rounded-full animate-pulse delay-400"></div>
              <span className="font-crimson">50 Audio Classes</span>
            </div>
          </motion.div>
        </div>

        {/* File Upload Section */}
        <motion.div
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
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.3 }}
            className="text-center py-16"
          >
            <div className="relative max-w-md mx-auto">
              <div className="absolute inset-0 bg-gradient-to-r from-rose-300/20 to-orange-300/20 rounded-2xl blur-xl"></div>
              <div className="relative bg-white/60 backdrop-blur-xl rounded-2xl p-8 border border-rose-200/50 shadow-lg">
                <div className="flex flex-col items-center space-y-6">
                  <div className="relative">
                    <div className="animate-spin rounded-full h-16 w-16 border-4 border-rose-200/40"></div>
                    <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-rose-500 absolute inset-0"></div>
                  </div>
                  <div className="text-center">
                    <h3 className="text-xl font-playfair font-medium text-rose-800 mb-2">
                      Analyzing Audio with SunoAI
                    </h3>
                    <p className="text-sm font-crimson text-gray-600 italic">
                      Processing neural network layers...
                    </p>
                  </div>
                  <div className="w-full space-y-2">
                    <div className="flex justify-between text-xs text-gray-500">
                      <span className="font-crimson">Progress</span>
                      <span className="font-medium">{Math.round(analysisState.progress)}%</span>
                    </div>
                    <div className="w-full bg-orange-100/60 rounded-full h-3 overflow-hidden">
                      <motion.div 
                        className="h-full bg-gradient-to-r from-rose-400 via-orange-400 to-amber-400 rounded-full"
                        initial={{ width: 0 }}
                        animate={{ width: `${analysisState.progress}%` }}
                        transition={{ duration: 0.3, ease: "easeOut" }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Error State */}
        {analysisState.error && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.3 }}
            className="text-center py-12"
          >
            <div className="relative max-w-md mx-auto">
              <div className="absolute inset-0 bg-gradient-to-r from-red-200/30 to-rose-200/30 rounded-2xl blur-xl"></div>
              <div className="relative bg-white/70 backdrop-blur-xl border border-red-300/40 rounded-2xl p-6 shadow-lg">
                <div className="flex items-center space-x-3 mb-3">
                  <div className="w-6 h-6 bg-red-400 rounded-full flex items-center justify-center">
                    <span className="text-white text-sm">!</span>
                  </div>
                  <h3 className="text-lg font-playfair font-medium text-red-700">Analysis Failed</h3>
                </div>
                <p className="text-red-600 text-sm font-crimson">{analysisState.error}</p>
              </div>
            </div>
          </motion.div>
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
      </main>
    </div>
  );
}
