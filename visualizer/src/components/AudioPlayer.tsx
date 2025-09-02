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
  audioFile?: File; // Add optional file prop to determine type
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

export function AudioPlayer({ audioUrl, waveformData, className = '', audioFile }: AudioPlayerProps) {
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
    
    // Capture the current ref value for cleanup
    const currentWaveformContainer = waveformRef.current;

    // Reset state
    updatePlayerState({ 
      isLoading: true, 
      error: null, 
      useFallback: false,
      isPlaying: false,
      currentTime: 0,
      duration: 0 
    });

    const initializeWaveSurfer = async () => {
      // Cleanup previous instance
      if (wavesurferRef.current) {
        try {
          wavesurferRef.current.destroy();
        } catch (error) {
          // Ignore cleanup errors
          console.warn('Error during cleanup:', error);
        }
        wavesurferRef.current = null;
      }
      
      // Clear the container to remove any leftover visualizations
      if (waveformRef.current) {
        waveformRef.current.innerHTML = '';
      }

      // Try WebAudio first for better visualization, fallback to MediaElement if needed
      const isMP3 = audioFile ? 
        (audioFile.type.includes('mp3') || audioFile.type.includes('mpeg') || audioFile.name.toLowerCase().endsWith('.mp3')) :
        (audioUrl.includes('mp3') || audioUrl.includes('mpeg'));

      // Set a timeout to fallback to native audio if WaveSurfer takes too long
      const fallbackTimeout: NodeJS.Timeout = setTimeout(() => {
        console.warn('WaveSurfer taking too long, falling back to native audio');
        updatePlayerState({
          useFallback: true,
          isLoading: false,
          error: null,
        });
      }, 15000); // 15 second timeout for all files

      // Function to retry with MediaElement backend for MP3 files
      const retryWithMediaElement = async () => {
        try {
          console.log('Retrying with MediaElement backend...');
          
          // Clean up previous WaveSurfer instance first
          if (wavesurferRef.current) {
            try {
              wavesurferRef.current.destroy();
            } catch (cleanupError) {
              console.warn('Error cleaning up previous WaveSurfer:', cleanupError);
            }
            wavesurferRef.current = null;
          }
          
          // Clear the container to remove any leftover visualizations
          if (waveformRef.current) {
            waveformRef.current.innerHTML = '';
          }
          
          const mediaElementConfig = {
            container: waveformRef.current!,
            waveColor: 'rgba(147, 197, 253, 0.8)',
            progressColor: 'rgba(59, 130, 246, 1)',
            cursorColor: 'rgba(249, 250, 251, 0.8)',
            barWidth: 2,
            barRadius: 1,
            barGap: 1,
            height: 400,
            normalize: true,
            backend: 'MediaElement' as const,
            mediaControls: false,
            fillParent: true,
            scrollParent: false,
            hideScrollbar: true,
            autoCenter: true,
            mediaType: 'audio' as const,
            preload: 'metadata' as const,
          };

          const mediaElementWavesurfer = WaveSurfer.create(mediaElementConfig);
          wavesurferRef.current = mediaElementWavesurfer;

          // Set up events for MediaElement attempt
          mediaElementWavesurfer.on('ready', () => {
            clearTimeout(fallbackTimeout);
            updatePlayerState({
              duration: mediaElementWavesurfer.getDuration(),
              isLoading: false,
            });
          });

          mediaElementWavesurfer.on('audioprocess', () => {
            updatePlayerState({
              currentTime: mediaElementWavesurfer.getCurrentTime(),
            });
          });

          mediaElementWavesurfer.on('timeupdate', () => {
            updatePlayerState({
              currentTime: mediaElementWavesurfer.getCurrentTime(),
            });
          });

          mediaElementWavesurfer.on('play', () => {
            updatePlayerState({ isPlaying: true });
          });

          mediaElementWavesurfer.on('pause', () => {
            updatePlayerState({ isPlaying: false });
          });

          mediaElementWavesurfer.on('finish', () => {
            updatePlayerState({ isPlaying: false, currentTime: 0 });
          });

          mediaElementWavesurfer.on('error', () => {
            console.error('MediaElement also failed, falling back to native audio');
            updatePlayerState({
              useFallback: true,
              isLoading: false,
              error: null,
            });
          });

          await mediaElementWavesurfer.load(audioUrl);
        } catch (retryError) {
          console.error('MediaElement retry failed:', retryError);
          updatePlayerState({
            useFallback: true,
            isLoading: false,
            error: null,
          });
        }
      };

      try {
        updatePlayerState({ isLoading: true, error: null });
        // Start with WebAudio for better waveform visualization
        const backend: 'MediaElement' | 'WebAudio' = 'WebAudio';
        
        console.log(`Using ${backend} backend for ${isMP3 ? 'MP3' : 'other'} audio file:`, audioFile?.name ?? audioUrl);

        const baseConfig = {
          container: waveformRef.current!,
          waveColor: 'rgba(147, 197, 253, 0.8)', // blue-300 with opacity
          progressColor: 'rgba(59, 130, 246, 1)', // blue-500
          cursorColor: 'rgba(249, 250, 251, 0.8)', // gray-50 with opacity
          barWidth: 2,
          barRadius: 1,
          barGap: 1,
          height: 400,
          normalize: true,
          backend,
          mediaControls: false,
          fillParent: true,
          scrollParent: false,
          hideScrollbar: true,
          autoCenter: true,
        };

        // Use WebAudio configuration for better waveform visualization
        const config = {
          ...baseConfig,
          forceDecode: false, // Let browser handle decoding when possible
          interact: true, // Enable waveform interaction
        };

        const wavesurfer = WaveSurfer.create(config);

        wavesurferRef.current = wavesurfer;

        // Set up event listeners before loading
        wavesurfer.on('ready', () => {
          clearTimeout(fallbackTimeout); // Clear timeout on successful load
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
          clearTimeout(fallbackTimeout); // Clear timeout on error
          console.error('WaveSurfer WebAudio error:', error);
          
          // For MP3 files, try MediaElement backend before giving up
          if (isMP3 && backend === 'WebAudio') {
            console.log('Retrying with MediaElement backend for MP3...');
            void retryWithMediaElement();
          } else {
            console.error('Falling back to native audio');
            updatePlayerState({
              useFallback: true,
              isLoading: false,
              error: null,
            });
          }
        });

        // Load audio - use a try-catch for blob URL issues
        try {
          await wavesurfer.load(audioUrl);
        } catch (loadError) {
          clearTimeout(fallbackTimeout); // Clear timeout on load error
          console.error('Failed to load audio URL with WebAudio:', loadError);
          
          // For MP3 files, try MediaElement backend before giving up
          if (isMP3 && backend === 'WebAudio') {
            console.log('Retrying with MediaElement backend for MP3...');
            void retryWithMediaElement();
          } else {
            console.error('Falling back to native audio');
            updatePlayerState({
              useFallback: true,
              isLoading: false,
              error: null,
            });
          }
        }

      } catch (error) {
        clearTimeout(fallbackTimeout); // Clear timeout on initialization error
        console.error('Failed to initialize WaveSurfer, falling back to native audio:', error);
        updatePlayerState({
          useFallback: true,
          isLoading: false,
          error: null,
        });
      }
    };

    void initializeWaveSurfer();

    // Cleanup
    return () => {
      if (wavesurferRef.current) {
        try {
          wavesurferRef.current.destroy();
        } catch (error) {
          // Ignore AbortError during cleanup
          if (error instanceof Error && error.name !== 'AbortError') {
            console.warn('Error during WaveSurfer cleanup:', error);
          }
        }
        wavesurferRef.current = null;
      }
      
      // Clear the container to remove any leftover visualizations
      if (currentWaveformContainer) {
        currentWaveformContainer.innerHTML = '';
      }
    };
  }, [audioUrl, audioFile, updatePlayerState]); // Added audioFile dependency

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

    // Load the audio with error handling
    try {
      audio.src = audioUrl;
      audio.load();
    } catch (error) {
      console.error('Failed to set audio source:', error);
      updatePlayerState({
        error: 'Failed to load audio file - format may not be supported',
        isLoading: false,
      });
    }

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
