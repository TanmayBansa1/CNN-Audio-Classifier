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
  audioFile?: File; // Keep this prop for compatibility
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

  // Initialize WaveSurfer - SIMPLIFIED WORKING VERSION
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
          waveColor: 'rgba(251, 113, 133, 0.8)',
          progressColor: 'rgba(251, 146, 60, 1)',
          cursorColor: 'rgba(239, 68, 68, 0.8)',
          barWidth: 3,
          barRadius: 2,
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
          // Ignore AbortError - this happens during cleanup and is normal
          if (error.name === 'AbortError') {
            return;
          }
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
          // Ignore AbortError during cleanup
          if (loadError instanceof Error && loadError.name === 'AbortError') {
            return;
          }
          console.error('Failed to load audio URL, falling back to native audio:', loadError);
          updatePlayerState({
            useFallback: true,
            isLoading: false,
          });
        }

      } catch (error) {
        // Ignore AbortError during cleanup
        if (error instanceof Error && error.name === 'AbortError') {
          return;
        }
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
        try {
          if (wavesurferRef.current.isPlaying()) {
            wavesurferRef.current.pause();
          }
          wavesurferRef.current.destroy();
        } catch (error) {
          // Ignore AbortError during cleanup - this is expected behavior
          if (error instanceof Error && error.name !== 'AbortError') {
            console.warn('Error during WaveSurfer cleanup:', error);
          }
        }
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
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className={`bg-gradient-to-br from-red-500/20 to-pink-600/20 backdrop-blur-sm rounded-2xl p-8 border border-red-400/30 ${className}`}
      >
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 bg-red-500/20 rounded-full flex items-center justify-center">
            <Volume2 className="w-8 h-8 text-red-400" />
          </div>
          <p className="text-red-200 text-lg font-medium">{playerState.error}</p>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`bg-white/80 backdrop-blur-sm rounded-2xl p-8 border border-rose-400/20 shadow-xl hover:shadow-2xl transition-shadow duration-300 ${className}`}
    >
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-r from-rose-400 to-orange-500 rounded-full blur-lg opacity-60"></div>
            <div className="relative w-12 h-12 bg-gradient-to-r from-rose-400 to-orange-500 rounded-full flex items-center justify-center">
              <Volume2 className="w-6 h-6 text-white" />
            </div>
          </div>
          <div>
            <h4 className="text-xl font-playfair font-medium bg-gradient-to-r from-rose-700 via-orange-700 to-pink-700 bg-clip-text text-transparent">
              Audio Waveform
            </h4>
            {playerState.useFallback && (
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-500/20 text-yellow-300 mt-1">
                Fallback Mode
              </span>
            )}
          </div>
        </div>
        {waveformData && (
          <div className="text-right">
            <div className="text-sm text-gray-300">{formatDuration(waveformData.duration)}</div>
            <div className="text-xs text-gray-400">{waveformData.sample_rate}Hz</div>
          </div>
        )}
      </div>

      {/* Waveform Container */}
      <div className="relative mb-8">
        {playerState.isLoading && (
          <div className="absolute inset-0 bg-black/30 backdrop-blur-sm rounded-2xl flex items-center justify-center z-10">
            <div className="flex flex-col items-center space-y-4">
              <div className="relative">
                <div className="w-16 h-16 border-4 border-rose-400/30 border-t-rose-400 rounded-full animate-spin"></div>
                <div className="absolute inset-0 w-16 h-16 border-4 border-transparent border-t-orange-400 rounded-full animate-spin" style={{ animationDirection: 'reverse', animationDuration: '1.5s' }}></div>
              </div>
              <p className="text-white/80 font-medium">Loading waveform...</p>
            </div>
          </div>
        )}
        
        {playerState.useFallback ? (
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-r from-rose-300/15 to-orange-300/15 rounded-2xl blur-xl"></div>
            <div className="relative bg-gradient-to-br from-white/10 to-orange-50/20 backdrop-blur-sm rounded-2xl overflow-hidden h-[400px] w-full flex items-center justify-center border border-orange-200/30">
              <div className="flex items-center space-x-1 w-full justify-center px-4">
                {Array.from({ length: 200 }).map((_, i) => {
                  const height = 20 + Math.random() * 360;
                  const delay = i * 20;
                  return (
                    <motion.div
                      key={i}
                      className="w-2 bg-gradient-to-t from-rose-400 to-orange-500 rounded-sm"
                      style={{ height: `${height}px` }}
                      animate={{
                        scaleY: [1, 0.3, 1],
                        opacity: [0.7, 1, 0.7],
                      }}
                      transition={{
                        duration: 2,
                        delay: delay / 1000,
                        repeat: Infinity,
                        ease: "easeInOut",
                      }}
                    />
                  );
                })}
              </div>
            </div>
          </div>
        ) : (
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-r from-rose-300/15 to-orange-300/15 rounded-2xl blur-xl"></div>
            <div
              ref={waveformRef}
              className="relative bg-gradient-to-br from-white/60 to-orange-50/80 rounded-2xl w-full border border-orange-200/40"
              style={{ minHeight: '400px', width: '100%', overflow: 'visible' }}
            />
          </div>
        )}
      </div>

      {/* Hidden fallback audio element */}
      <audio
        ref={fallbackAudioRef}
        style={{ display: 'none' }}
        preload="metadata"
      />

      {/* Controls */}
        <div className="space-y-6">
        {/* Play Controls */}
        <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <motion.button
              onClick={handlePlayPause}
              disabled={playerState.isLoading}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="relative w-14 h-14 group disabled:opacity-50 disabled:cursor-not-allowed"
            >
                <div className="absolute inset-0 bg-gradient-to-r from-rose-400 to-orange-500 rounded-full blur-lg opacity-60 group-hover:opacity-100 transition-opacity duration-300"></div>
                <div className="relative w-full h-full bg-gradient-to-r from-rose-400 to-orange-500 rounded-full flex items-center justify-center text-white shadow-xl border border-white/30">
              {playerState.isPlaying ? (
                    <Pause className="w-6 h-6" />
              ) : (
                    <Play className="w-6 h-6 ml-0.5" />
              )}
                </div>
              </motion.button>
            
              <motion.button
              onClick={handleRestart}
              disabled={playerState.isLoading}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="w-12 h-12 bg-white/30 backdrop-blur-sm rounded-full flex items-center justify-center text-gray-600 hover:bg-white/50 hover:text-gray-800 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed border border-orange-200/50"
            >
                <RotateCcw className="w-5 h-5" />
              </motion.button>
          </div>

          {/* Volume Control */}
          <div className="flex items-center space-x-3">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-rose-400/20 to-orange-500/20 rounded-full blur-sm"></div>
              <div className="relative w-10 h-10 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center border border-white/30">
                <Volume2 className="w-4 h-4 text-gray-300" />
              </div>
            </div>
            <div className="relative flex-1 max-w-24">
              <input
                type="range"
                min="0"
                max="1"
                step="0.1"
                value={playerState.volume}
                onChange={handleVolumeChange}
                className="w-full h-2 bg-gradient-to-r from-white/20 to-white/10 rounded-full appearance-none cursor-pointer backdrop-blur-sm border border-white/20"
                style={{
                  background: `linear-gradient(to right, 
                    rgba(251, 113, 133, 0.8) 0%, 
                    rgba(251, 146, 60, 0.8) ${playerState.volume * 100}%, 
                    rgba(255, 255, 255, 0.2) ${playerState.volume * 100}%, 
                    rgba(255, 255, 255, 0.2) 100%)`
                }}
              />
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="space-y-3">
          <div className="flex justify-between text-sm">
            <span className="text-gray-300 font-medium">{formatDuration(playerState.currentTime)}</span>
            <span className="text-gray-400">{formatDuration(playerState.duration)}</span>
          </div>
          
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-r from-rose-300/20 to-orange-300/20 rounded-full blur-sm"></div>
            <div className="relative w-full bg-white/20 backdrop-blur-sm rounded-full h-2 border border-white/30 overflow-hidden">
              <motion.div
                className="bg-gradient-to-r from-rose-400 to-orange-500 h-full rounded-full shadow-lg"
                initial={{ width: 0 }}
                animate={{ width: `${progressPercentage}%` }}
                transition={{ duration: 0.1 }}
              />
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        input[type="range"]::-webkit-slider-thumb {
          appearance: none;
          width: 16px;
          height: 16px;
          border-radius: 50%;
          background: linear-gradient(45deg, #fb7185, #fb923c);
          cursor: pointer;
          border: 2px solid white;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
        }
        
        input[type="range"]::-moz-range-thumb {
          width: 16px;
          height: 16px;
          border-radius: 50%;
          background: linear-gradient(45deg, #fb7185, #fb923c);
          cursor: pointer;
          border: 2px solid white;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
        }
      `}</style>
    </motion.div>
  );
}