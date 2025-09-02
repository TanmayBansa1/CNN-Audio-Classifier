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
  useFallback: boolean;
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
    useFallback: false,
  });

  const fallbackAudioRef = useRef<HTMLAudioElement>(null);

  const updatePlayerState = useCallback((updates: Partial<PlayerState>) => {
    setPlayerState(prev => ({ ...prev, ...updates }));
  }, []);

  // Initialize WaveSurfer
  useEffect(() => {
    if (!waveformRef.current || !audioUrl) return;

    const initializeWaveSurfer = async () => {
      try {
        updatePlayerState({ isLoading: true, error: null });

        // Cleanup previous instance
        if (wavesurferRef.current) {
          wavesurferRef.current.destroy();
          wavesurferRef.current = null;
        }

        const wavesurfer = WaveSurfer.create({
          container: waveformRef.current!,
          waveColor: 'rgba(147, 197, 253, 0.8)', // blue-300 with opacity
          progressColor: 'rgba(59, 130, 246, 1)', // blue-500
          cursorColor: 'rgba(249, 250, 251, 0.8)', // gray-50 with opacity
          barWidth: 2,
          barRadius: 1,
          barGap: 1,
          height: 400,
          normalize: true,
          backend: 'WebAudio', // Force WebAudio backend for better blob URL support
          mediaControls: false
        });

        wavesurferRef.current = wavesurfer;

        // Set up event listeners before loading
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
            error: 'Failed to load audio file. Please try a different format.',
            isLoading: false,
          });
        });

        // Load audio - use a try-catch for blob URL issues
        try {
          await wavesurfer.load(audioUrl);
        } catch (loadError) {
          console.error('Failed to load audio URL, falling back to native audio:', loadError);
          updatePlayerState({
            useFallback: true,
            isLoading: false,
          });
        }

      } catch (error) {
        console.error('Failed to initialize WaveSurfer, falling back to native audio:', error);
        updatePlayerState({
          useFallback: true,
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
  }, [audioUrl, updatePlayerState]); // Removed playerState.volume from dependencies

  // Fallback audio element effect
  useEffect(() => {
    if (!playerState.useFallback || !fallbackAudioRef.current) return;

    const audio = fallbackAudioRef.current;
    
    const handleLoadedMetadata = () => {
      updatePlayerState({
        duration: audio.duration,
        isLoading: false,
      });
    };

    const handleTimeUpdate = () => {
      updatePlayerState({
        currentTime: audio.currentTime,
      });
    };

    const handlePlay = () => {
      updatePlayerState({ isPlaying: true });
    };

    const handlePause = () => {
      updatePlayerState({ isPlaying: false });
    };

    const handleEnded = () => {
      updatePlayerState({ isPlaying: false, currentTime: 0 });
    };

    const handleError = () => {
      updatePlayerState({
        error: 'Failed to load audio file',
        isLoading: false,
      });
    };

    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('play', handlePlay);
    audio.addEventListener('pause', handlePause);
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('error', handleError);

    // Load the audio
    audio.src = audioUrl;
    audio.load();

    return () => {
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('play', handlePlay);
      audio.removeEventListener('pause', handlePause);
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('error', handleError);
    };
  }, [playerState.useFallback, audioUrl, updatePlayerState]);

  // Set volume for WaveSurfer
  useEffect(() => {
    if (!playerState.useFallback && wavesurferRef.current && !playerState.isLoading) {
      try {
        wavesurferRef.current.setVolume(playerState.volume);
      } catch (error) {
        console.warn('Failed to set WaveSurfer volume:', error);
      }
    }
  }, [playerState.useFallback, playerState.volume, playerState.isLoading]);

  // Set volume for fallback audio
  useEffect(() => {
    if (playerState.useFallback && fallbackAudioRef.current) {
      fallbackAudioRef.current.volume = playerState.volume;
    }
  }, [playerState.useFallback, playerState.volume]);

  const handlePlayPause = useCallback(() => {
    if (playerState.useFallback && fallbackAudioRef.current) {
      if (playerState.isPlaying) {
        fallbackAudioRef.current.pause();
      } else {
        void fallbackAudioRef.current.play();
      }
    } else if (wavesurferRef.current) {
      if (playerState.isPlaying) {
        wavesurferRef.current.pause();
      } else {
        void wavesurferRef.current.play();
      }
    }
  }, [playerState.isPlaying, playerState.useFallback]);

  const handleRestart = useCallback(() => {
    if (playerState.useFallback && fallbackAudioRef.current) {
      fallbackAudioRef.current.currentTime = 0;
      updatePlayerState({ currentTime: 0 });
    } else if (wavesurferRef.current) {
      wavesurferRef.current.seekTo(0);
      updatePlayerState({ currentTime: 0 });
    }
  }, [updatePlayerState, playerState.useFallback]);

  const handleVolumeChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = parseFloat(event.target.value);
    updatePlayerState({ volume: newVolume });
    // Volume will be set by the useEffect hooks
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
        <div className="flex items-center space-x-2">
          <h4 className="text-xl font-bold text-white">Audio Waveform</h4>
          {playerState.useFallback && (
            <span className="text-xs bg-yellow-500/20 text-yellow-300 px-2 py-1 rounded">
              Fallback Mode
            </span>
          )}
        </div>
        {waveformData && (
          <div className="text-sm text-gray-300">
            {formatDuration(waveformData.duration)} • {waveformData.sample_rate}Hz
          </div>
        )}
      </div>

      {/* Waveform Container */}
      <div className="relative mb-6 w-full">
        {playerState.isLoading && (
          <div className="absolute inset-0 bg-black/30 rounded-lg flex items-center justify-center z-10 h-full">
            <div className="animate-spin rounded-full h-[400px] w-[400px] border-b-2 border-blue-500"></div>
          </div>
        )}
        
        {playerState.useFallback ? (
          <div className="bg-black/30 rounded-lg overflow-hidden h-[400px] w-full flex items-center justify-center">
            <div className="flex items-center space-x-1 w-full justify-center">
              {Array.from({ length: 400 }).map((_, i) => (
                <div
                  key={i}
                  className="w-1 bg-blue-400 rounded-sm animate-pulse"
                  style={{
                    height: `${20 + Math.random() * 400}px`,
                    animationDelay: `${i * 30}ms`,
                    animationDuration: '2s',
                  }}
                />
              ))}
            </div>
          </div>
        ) : (
          <div
            ref={waveformRef}
            className="bg-black/30 rounded-lg overflow-hidden w-full"
            style={{ minHeight: '400px', width: '100%' }}
          />
        )}
      </div>

      {/* Hidden fallback audio element */}
      <audio
        ref={fallbackAudioRef}
        style={{ display: 'none' }}
        preload="metadata"
      />

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
