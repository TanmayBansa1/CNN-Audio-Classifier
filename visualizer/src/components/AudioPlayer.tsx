'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Play, Pause, RotateCcw, Volume2 } from 'lucide-react';
import WaveSurfer from 'wavesurfer.js';
import type { WaveformData } from '~/lib/types';
import { formatDuration } from '~/lib/audio-utils';

interface AudioPlayerProps {
  audioUrl: string;
  waveformData?: WaveformData;
  className?: string;
}

interface PlayerState {
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  isLoading: boolean;
  error: string | null;
}

export function AudioPlayer({ audioUrl, waveformData, className = '' }: AudioPlayerProps) {
  const waveformRef = useRef<HTMLDivElement>(null);
  const wavesurferRef = useRef<WaveSurfer | null>(null);
  
  const [playerState, setPlayerState] = useState<PlayerState>({
    isPlaying: false,
    currentTime: 0,
    duration: 0,
    volume: 0.7,
    isLoading: true,
    error: null,
  });

  const updatePlayerState = useCallback((updates: Partial<PlayerState>) => {
    setPlayerState(prev => ({ ...prev, ...updates }));
  }, []);

  // Initialize WaveSurfer
  useEffect(() => {
    if (!waveformRef.current) return;

    const initializeWaveSurfer = async () => {
      try {
        updatePlayerState({ isLoading: true, error: null });

        const wavesurfer = WaveSurfer.create({
          container: waveformRef.current!,
          waveColor: 'rgba(147, 197, 253, 0.8)', // blue-300 with opacity
          progressColor: 'rgba(59, 130, 246, 1)', // blue-500
          cursorColor: 'rgba(249, 250, 251, 0.8)', // gray-50 with opacity
          barWidth: 2,
          barRadius: 1,
          barGap: 1,
          height: 80,
          normalize: true,
        });

        // Load audio
        await wavesurfer.load(audioUrl);
        
        // Set up event listeners
        wavesurfer.on('ready', () => {
          updatePlayerState({
            duration: wavesurfer.getDuration(),
            isLoading: false,
          });
        });

        wavesurfer.on('audioprocess', () => {
          updatePlayerState({
            currentTime: wavesurfer.getCurrentTime(),
          });
        });

        wavesurfer.on('timeupdate', () => {
          updatePlayerState({
            currentTime: wavesurfer.getCurrentTime(),
          });
        });

        wavesurfer.on('play', () => {
          updatePlayerState({ isPlaying: true });
        });

        wavesurfer.on('pause', () => {
          updatePlayerState({ isPlaying: false });
        });

        wavesurfer.on('finish', () => {
          updatePlayerState({ isPlaying: false, currentTime: 0 });
        });

        wavesurfer.on('error', (error: Error) => {
          console.error('WaveSurfer error:', error);
          updatePlayerState({
            error: 'Failed to load audio',
            isLoading: false,
          });
        });

        // Set initial volume
        wavesurfer.setVolume(playerState.volume);
        
        wavesurferRef.current = wavesurfer;

      } catch (error) {
        console.error('Failed to initialize WaveSurfer:', error);
        updatePlayerState({
          error: 'Failed to initialize audio player',
          isLoading: false,
        });
      }
    };

    void initializeWaveSurfer();

    // Cleanup
    return () => {
      if (wavesurferRef.current) {
        wavesurferRef.current.destroy();
        wavesurferRef.current = null;
      }
    };
  }, [audioUrl, playerState.volume, updatePlayerState]);

  const handlePlayPause = useCallback(() => {
    if (!wavesurferRef.current) return;

    if (playerState.isPlaying) {
      wavesurferRef.current.pause();
    } else {
      void wavesurferRef.current.play();
    }
  }, [playerState.isPlaying]);

  const handleRestart = useCallback(() => {
    if (!wavesurferRef.current) return;
    
    wavesurferRef.current.seekTo(0);
    updatePlayerState({ currentTime: 0 });
  }, [updatePlayerState]);

  const handleVolumeChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = parseFloat(event.target.value);
    updatePlayerState({ volume: newVolume });
    
    if (wavesurferRef.current) {
      wavesurferRef.current.setVolume(newVolume);
    }
  }, [updatePlayerState]);

  const progressPercentage = playerState.duration > 0 
    ? (playerState.currentTime / playerState.duration) * 100 
    : 0;

  if (playerState.error) {
    return (
      <div className={`bg-red-900/50 border border-red-500/50 rounded-lg p-6 ${className}`}>
        <p className="text-red-200 text-center">{playerState.error}</p>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20 ${className}`}
    >
      <div className="flex items-center justify-between mb-4">
        <h4 className="text-xl font-bold text-white">Audio Waveform</h4>
        {waveformData && (
          <div className="text-sm text-gray-300">
            {formatDuration(waveformData.duration)} • {waveformData.sample_rate}Hz
          </div>
        )}
      </div>

      {/* Waveform Container */}
      <div className="relative mb-6">
        {playerState.isLoading && (
          <div className="absolute inset-0 bg-black/30 rounded-lg flex items-center justify-center z-10">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          </div>
        )}
        <div
          ref={waveformRef}
          className="bg-black/30 rounded-lg overflow-hidden"
          style={{ minHeight: '80px' }}
        />
      </div>

      {/* Controls */}
      <div className="space-y-4">
        {/* Play Controls */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <button
              onClick={handlePlayPause}
              disabled={playerState.isLoading}
              className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white hover:from-blue-600 hover:to-purple-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {playerState.isPlaying ? (
                <Pause className="w-5 h-5 ml-0.5" />
              ) : (
                <Play className="w-5 h-5 ml-0.5" />
              )}
            </button>
            
            <button
              onClick={handleRestart}
              disabled={playerState.isLoading}
              className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center text-gray-300 hover:bg-white/20 hover:text-white transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>

          {/* Volume Control */}
          <div className="flex items-center space-x-2">
            <Volume2 className="w-4 h-4 text-gray-300" />
            <input
              type="range"
              min="0"
              max="1"
              step="0.1"
              value={playerState.volume}
              onChange={handleVolumeChange}
              className="w-20 h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer slider"
            />
          </div>
        </div>

        {/* Progress Bar */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm text-gray-300">
            <span>{formatDuration(playerState.currentTime)}</span>
            <span>{formatDuration(playerState.duration)}</span>
          </div>
          
          <div className="w-full bg-gray-700 rounded-full h-2">
            <motion.div
              className="bg-gradient-to-r from-blue-500 to-purple-600 h-2 rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${progressPercentage}%` }}
              transition={{ duration: 0.1 }}
            />
          </div>
        </div>
      </div>

      <style jsx>{`
        .slider::-webkit-slider-thumb {
          appearance: none;
          width: 16px;
          height: 16px;
          border-radius: 50%;
          background: linear-gradient(45deg, #3b82f6, #8b5cf6);
          cursor: pointer;
          border: 2px solid white;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
        }
        
        .slider::-moz-range-thumb {
          width: 16px;
          height: 16px;
          border-radius: 50%;
          background: linear-gradient(45deg, #3b82f6, #8b5cf6);
          cursor: pointer;
          border: 2px solid white;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
        }
      `}</style>
    </motion.div>
  );
}
