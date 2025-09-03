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
import Footer from '~/components/Footer';
import Header from '~/components/Header';
import Hero from '~/components/Hero';
import LoadingState from '~/components/LoadingState';
import Error from '~/components/Error';
import Architecture3D from '~/components/Architecture3D';
import ArchitectureExplainer from '~/components/ArchitectureExplainer';
import StatsHighlight from '~/components/StatsHighlight';
import CTA from '~/components/CTA';

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
          error: typeof mockError === 'object' && mockError !== null && 'message' in mockError 
            ? String((mockError as { message?: unknown }).message)
            : 'Analysis failed',
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
      <Header></Header>

      {/* Main Content */}
      <main className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <Hero></Hero>


        {/* Showcase Sections */}
        <div className="space-y-8 mb-16">
          <CTA onClick={() => {
            const el = document.getElementById('upload-section');
            if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }} />
          <Architecture3D />
          <ArchitectureExplainer />
          <StatsHighlight />
        </div>
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
      </main>
      <Footer></Footer>
    </div>
  );
}
