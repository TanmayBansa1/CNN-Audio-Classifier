'use client';

import { useEffect, useRef, useState, useMemo, useCallback } from 'react';
import { motion } from 'framer-motion';
import * as d3 from 'd3';
import { ZoomIn, ZoomOut, RotateCcw, Palette, BarChart3 } from 'lucide-react';
import { Button } from '~/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '~/components/ui/card';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '~/components/ui/tooltip';
import { Slider } from '~/components/ui/slider';
import { type SpectrogramData } from '~/lib/types';

interface SpectrogramVisualizationProps {
  data: SpectrogramData;
  title?: string;
  className?: string;
}

interface ColorScheme {
  name: string;
  colors: string[];
}

interface ZoomState {
  scaleX: number;
  scaleY: number;
  translateX: number;
  translateY: number;
}

const COLOR_SCHEMES: ColorScheme[] = [
  {
    name: 'Viridis',
    colors: ['#440154', '#31688e', '#35b779', '#fde725']
  },
  {
    name: 'Plasma',
    colors: ['#0d0887', '#7e03a8', '#cc4778', '#f89441', '#f0f921']
  },
  {
    name: 'Magma',
    colors: ['#000004', '#3b0f70', '#8c2981', '#de4968', '#fe9f6d', '#fcfdbf']
  },
  {
    name: 'Turbo',
    colors: ['#30123b', '#4662d7', '#36bbce', '#1dd357', '#faba39', '#fa4238']
  }
];

export function SpectrogramVisualization({ 
  data, 
  title = 'Mel-Spectrogram', 
  className = '' 
}: SpectrogramVisualizationProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  
  const [colorSchemeIndex, setColorSchemeIndex] = useState<number>(0);
  const [dynamicRange, setDynamicRange] = useState<[number]>([80]);
  const [zoomState, setZoomState] = useState<ZoomState>({
    scaleX: 1,
    scaleY: 1,
    translateX: 0,
    translateY: 0
  });
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Memoized processed data
  const processedData = useMemo(() => {
    try {
      if (!data?.values || !Array.isArray(data.values)) {
        throw new Error('Invalid spectrogram data format');
      }

      const [freqBins, timeBins] = data.shape;
      if (!freqBins || !timeBins || freqBins <= 0 || timeBins <= 0) {
        throw new Error('Invalid spectrogram dimensions');
      }

      // Flatten the 2D array and find min/max values
      const flatValues = data.values.flat();
      const minValue = Math.min(...flatValues);
      const maxValue = Math.max(...flatValues);
      
      // Apply dynamic range compression
      const rangeLimit = dynamicRange[0] || 80;
      const threshold = maxValue - rangeLimit;
      
      const normalizedData = data.values.map(row =>
        row.map(value => {
          const clampedValue = Math.max(value, threshold);
          return (clampedValue - threshold) / (maxValue - threshold);
        })
      );

      return {
        normalized: normalizedData,
        original: data.values,
        minValue,
        maxValue,
        freqBins,
        timeBins,
        threshold
      };
    } catch (err) {
      console.error('Error processing spectrogram data:', err);
      setError(err instanceof Error ? err.message : 'Failed to process data');
      return null;
    }
  }, [data, dynamicRange]);

  // Memoized color scale
  const colorScale = useMemo(() => {
    const scheme = COLOR_SCHEMES[colorSchemeIndex];
    return d3.scaleSequential()
      .domain([0, 1])
      .interpolator(d3.interpolateRgbBasis(scheme?.colors ?? []));
  }, [colorSchemeIndex]);

  // Reset zoom function
  const resetZoom = useCallback(() => {
    setZoomState({
      scaleX: 1,
      scaleY: 1,
      translateX: 0,
      translateY: 0
    });
  }, []);

  // Zoom functions
  const handleZoomIn = useCallback(() => {
    setZoomState(prev => ({
      ...prev,
      scaleX: Math.min(prev.scaleX * 1.5, 10),
      scaleY: Math.min(prev.scaleY * 1.5, 10)
    }));
  }, []);

  const handleZoomOut = useCallback(() => {
    setZoomState(prev => ({
      ...prev,
      scaleX: Math.max(prev.scaleX / 1.5, 0.5),
      scaleY: Math.max(prev.scaleY / 1.5, 0.5)
    }));
  }, []);

  // Cycle color schemes
  const cycleColorScheme = useCallback(() => {
    setColorSchemeIndex(prev => (prev + 1) % COLOR_SCHEMES.length);
  }, []);

  // Main rendering function
  const renderSpectrogram = useCallback(() => {
    if (!processedData || !canvasRef.current || !containerRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const container = containerRef.current;
    const containerRect = container.getBoundingClientRect();
    
    // Set canvas size to match container
    const pixelRatio = window.devicePixelRatio || 1;
    canvas.width = containerRect.width * pixelRatio;
    canvas.height = containerRect.height * pixelRatio;
    canvas.style.width = `${containerRect.width}px`;
    canvas.style.height = `${containerRect.height}px`;
    
    ctx.scale(pixelRatio, pixelRatio);

    // Clear canvas
    ctx.clearRect(0, 0, containerRect.width, containerRect.height);

    const { normalized, freqBins, timeBins } = processedData;

    // Calculate cell dimensions
    const cellWidth = containerRect.width / timeBins;
    const cellHeight = containerRect.height / freqBins;

    // Apply zoom and translation
    ctx.save();
    ctx.translate(zoomState.translateX, zoomState.translateY);
    ctx.scale(zoomState.scaleX, zoomState.scaleY);

    // Render spectrogram
    try {
      for (let freqIndex = 0; freqIndex < freqBins; freqIndex++) {
        for (let timeIndex = 0; timeIndex < timeBins; timeIndex++) {
          const value = normalized[freqIndex]?.[timeIndex];
          if (typeof value !== 'number' || isNaN(value)) continue;

          const color = colorScale(value);
          ctx.fillStyle = color;
          
          const x = timeIndex * cellWidth;
          const y = (freqBins - freqIndex - 1) * cellHeight; // Flip Y axis
          
          ctx.fillRect(x, y, cellWidth, cellHeight);
        }
      }
    } catch (err) {
      console.error('Error rendering spectrogram:', err);
      setError('Failed to render visualization');
    }

    ctx.restore();
    setIsLoading(false);
  }, [processedData, colorScale, zoomState]);

  // Effect to render spectrogram when dependencies change
  useEffect(() => {
    if (!processedData) return;
    
    setIsLoading(true);
    setError(null);
    
    // Use requestAnimationFrame for smooth rendering
    const renderFrame = () => {
      renderSpectrogram();
    };
    
    requestAnimationFrame(renderFrame);
  }, [renderSpectrogram, processedData]);

  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      renderSpectrogram();
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [renderSpectrogram]);

  if (error) {
    return (
      <Card className={`bg-red-900/50 border-red-500/50 ${className}`}>
        <CardContent className="p-6">
          <p className="text-red-200 text-center">{error}</p>
        </CardContent>
      </Card>
    );
  }

  if (!processedData) {
    return (
      <Card className={className}>
        <CardContent className="p-6">
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <TooltipProvider>
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        whileHover={{ y: -5 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className={`relative group ${className}`}
      >
        {/* Background Effects */}
        <div className="absolute inset-0 bg-gradient-to-r from-blue-300/30 via-indigo-300/30 to-purple-300/30 rounded-3xl blur-xl opacity-60 group-hover:opacity-80 transition-opacity duration-500"></div>
        
        <Card className="relative bg-white/80 backdrop-blur-xl border border-blue-300/40 rounded-3xl shadow-lg">
          <CardHeader className="pb-6">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center space-x-3 text-xl font-playfair font-medium">
                <div className="relative">
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-purple-500 rounded-full blur-lg opacity-75 animate-pulse"></div>
                  <div className="relative w-8 h-8 bg-gradient-to-r from-blue-400 to-purple-500 rounded-full flex items-center justify-center">
                    <BarChart3 className="w-5 h-5 text-white" />
                  </div>
                </div>
                <span className="bg-gradient-to-r from-purple-700 via-blue-400 to-purple-400 bg-clip-text text-transparent">
                  {title}
                </span>
              </CardTitle>
              
              <div className="flex items-center space-x-2">
                {/* Zoom Controls */}
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleZoomIn}
                      className="bg-white/10 border-white/20 text-white hover:bg-white/20"
                    >
                      <ZoomIn className="w-4 h-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Zoom In</TooltipContent>
                </Tooltip>

                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleZoomOut}
                      className="bg-white/10 border-white/20 text-white hover:bg-white/20"
                    >
                      <ZoomOut className="w-4 h-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Zoom Out</TooltipContent>
                </Tooltip>

                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={resetZoom}
                      className="bg-white/10 border-white/20 text-white hover:bg-white/20"
                    >
                      <RotateCcw className="w-4 h-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Reset Zoom</TooltipContent>
                </Tooltip>

                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={cycleColorScheme}
                      className="bg-white/10 border-white/20 text-white hover:bg-white/20"
                    >
                      <Palette className="w-4 h-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    Color: {COLOR_SCHEMES[colorSchemeIndex]?.name}
                  </TooltipContent>
                </Tooltip>
              </div>
            </div>

            {/* Dynamic Range Control */}
            <div className="flex items-center space-x-4 mt-4">
              <span className="text-sm text-gray-300 min-w-0">Dynamic Range:</span>
              <div className="flex-1">
                <Slider
                  value={dynamicRange}
                  onValueChange={setDynamicRange as (value: number[]) => void}
                  max={120}
                  min={40}
                  step={5}
                  className="w-full"
                />
              </div>
              <span className="text-sm text-gray-300 min-w-0">{dynamicRange[0]}dB</span>
            </div>
          </CardHeader>

          <CardContent className="p-8 pt-0">
            {/* Canvas Container */}
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-300/20 to-indigo-300/20 rounded-2xl blur-xl"></div>
              <div
                ref={containerRef}
                className="relative bg-gradient-to-br from-white/50 to-blue-50/80 backdrop-blur-sm rounded-2xl overflow-hidden border border-blue-200/40"
                style={{ height: '400px' }}
              >
                {isLoading && (
                  <div className="absolute inset-0 flex items-center justify-center z-10">
                    <div className="text-center space-y-4">
                      <div className="relative">
                        <div className="animate-spin rounded-full h-12 w-12 border-4 border-purple-500/30"></div>
                        <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-blue-500 absolute inset-0"></div>
                      </div>
                      <p className="text-white font-medium">Rendering spectrogram...</p>
                    </div>
                  </div>
                )}
              
                <canvas
                  ref={canvasRef}
                  className="w-full h-full object-contain cursor-crosshair"
                />
              </div>
            </div>

            {/* Info Display */}
            {processedData && (
              <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-6">
                <motion.div 
                  className="text-center group"
                  whileHover={{ scale: 1.05 }}
                  transition={{ duration: 0.2 }}
                >
                  <div className="text-sm font-medium text-blue-300 mb-1">Frequency Bins</div>
                  <div className="text-xl font-poppins font-bold text-transparent bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text">
                    {processedData.freqBins}
                  </div>
                </motion.div>
                <motion.div 
                  className="text-center group"
                  whileHover={{ scale: 1.05 }}
                  transition={{ duration: 0.2 }}
                >
                  <div className="text-sm font-medium text-purple-300 mb-1">Time Frames</div>
                  <div className="text-xl font-poppins font-bold text-transparent bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text">
                    {processedData.timeBins}
                  </div>
                </motion.div>
                <motion.div 
                  className="text-center group"
                  whileHover={{ scale: 1.05 }}
                  transition={{ duration: 0.2 }}
                >
                  <div className="text-sm font-medium text-green-300 mb-1">Min Value</div>
                  <div className="text-xl font-poppins font-bold text-transparent bg-gradient-to-r from-green-400 to-emerald-400 bg-clip-text">
                    {processedData.minValue.toFixed(1)}dB
                  </div>
                </motion.div>
                <motion.div 
                  className="text-center group"
                  whileHover={{ scale: 1.05 }}
                  transition={{ duration: 0.2 }}
                >
                  <div className="text-sm font-medium text-orange-300 mb-1">Max Value</div>
                  <div className="text-xl font-poppins font-bold text-transparent bg-gradient-to-r from-orange-400 to-red-400 bg-clip-text">
                    {processedData.maxValue.toFixed(1)}dB
                  </div>
                </motion.div>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </TooltipProvider>
  );
}

