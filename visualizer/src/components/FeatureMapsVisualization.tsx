'use client';

import { useState, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, ChevronRight, Eye, EyeOff, Layers, Info } from 'lucide-react';
import { Button } from '~/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '~/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '~/components/ui/tabs';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '~/components/ui/tooltip';
import type { FeatureMap } from '~/lib/types';
import { CustomHeatmap } from './CustomHeatmap';

interface FeatureMapsVisualizationProps {
  featureMaps: Record<string, FeatureMap>;
  className?: string;
}

interface LayerInfo {
  name: string;
  displayName: string;
  type: 'main' | 'residual';
  blockIndex?: number;
  shape: number[];
  activationCount: number;
}

interface ProcessedLayer {
  info: LayerInfo;
  data: FeatureMap;
  heatmapData: number[][];
  statistics: {
    mean: number;
    std: number;
    min: number;
    max: number;
    sparsity: number;
  };
}

const LAYER_DISPLAY_NAMES: Record<string, string> = {
  'layer1': 'Layer 1 (Initial Conv)',
  'layer2': 'Layer 2 (ResBlocks)',
  'layer3': 'Layer 3 (ResBlocks)',
  'layer4': 'Layer 4 (ResBlocks)',
  'layer5': 'Layer 5 (ResBlocks)',
};

function FeatureMapsVisualization({ 
  featureMaps, 
  className = '' 
}: FeatureMapsVisualizationProps) {
  const [selectedLayer, setSelectedLayer] = useState<string>('');
  const [expandedLayers, setExpandedLayers] = useState<Set<string>>(new Set());
  const [hiddenLayers, setHiddenLayers] = useState<Set<string>>(new Set());

  // Process and organize feature maps
  const processedLayers = useMemo((): ProcessedLayer[] => {
    const layers: ProcessedLayer[] = [];

    Object.entries(featureMaps).forEach(([layerName, data]) => {
      if (!data?.values || !Array.isArray(data.values)) return;

      // Parse layer information
      const isResidualBlock = layerName.includes('block');
      const layerMatch = /layer(\d+)/.exec(layerName);
      const blockMatch = /block-?(\d+)/.exec(layerName);

      const layerInfo: LayerInfo = {
        name: layerName,
        displayName: isResidualBlock 
          ? `${LAYER_DISPLAY_NAMES[layerMatch?.[0] ?? '']} - Block ${blockMatch?.[1] ?? ''}` 
          : LAYER_DISPLAY_NAMES[layerName] ?? layerName,
        type: isResidualBlock ? 'residual' : 'main',
        blockIndex: blockMatch ? parseInt(blockMatch[1]!, 10) : undefined,
        shape: data.shape,
        activationCount: data.shape.reduce((a, b) => a * b, 1),
      };

      // Calculate statistics
      const flatValues = data.values.flat();
      const validValues = flatValues.filter(v => typeof v === 'number' && !isNaN(v));
      
      const mean = validValues.reduce((sum, val) => sum + val, 0) / validValues.length;
      const variance = validValues.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / validValues.length;
      const std = Math.sqrt(variance);
      const min = Math.min(...validValues);
      const max = Math.max(...validValues);
      const sparsity = validValues.filter(v => Math.abs(v) < 0.01).length / validValues.length;

      const statistics = { mean, std, min, max, sparsity };

      // Create heatmap data (aggregate channels if needed)
      let heatmapData: number[][];
      if (data.shape.length === 2) {
        heatmapData = data.values;
      } else {
        // For larger tensors, take mean across channels or aggregate
        heatmapData = data.values;
      }

      layers.push({
        info: layerInfo,
        data,
        heatmapData,
        statistics,
      });
    });

    // Sort layers by logical order
    return layers.sort((a, b) => {
      const aLayerNum = parseInt(/layer(\d+)/.exec(a.info.name)?.[1] ?? '0', 10);
      const bLayerNum = parseInt(/layer(\d+)/.exec(b.info.name)?.[1] ?? '0', 10);
      
      if (aLayerNum !== bLayerNum) return aLayerNum - bLayerNum;
      
      const aBlockNum = a.info.blockIndex ?? 0;
      const bBlockNum = b.info.blockIndex ?? 0;
      return aBlockNum - bBlockNum;
    });
  }, [featureMaps]);

  // Group layers by main layer
  const groupedLayers = useMemo(() => {
    const groups: Record<string, ProcessedLayer[]> = {};
    
    processedLayers.forEach(layer => {
      const mainLayer = /layer\d+/.exec(layer.info.name)?.[0] ?? 'other';
      groups[mainLayer] ??= [];
      groups[mainLayer].push(layer);
    });
    
    return groups;
  }, [processedLayers]);

  const toggleLayerExpansion = useCallback((layerName: string) => {
    setExpandedLayers(prev => {
      const newSet = new Set(prev);
      if (newSet.has(layerName)) {
        newSet.delete(layerName);
      } else {
        newSet.add(layerName);
      }
      return newSet;
    });
  }, []);

  const toggleLayerVisibility = useCallback((layerName: string) => {
    setHiddenLayers(prev => {
      const newSet = new Set(prev);
      if (newSet.has(layerName)) {
        newSet.delete(layerName);
      } else {
        newSet.add(layerName);
      }
      return newSet;
    });
  }, []);

  // Color schemes for heatmaps
  const COLOR_SCHEMES = [
    ['#440154', '#31688e', '#35b779', '#fde725'], // Viridis
    ['#0d0887', '#7e03a8', '#cc4778', '#f89441', '#f0f921'], // Plasma
    ['#000004', '#3b0f70', '#8c2981', '#de4968', '#fe9f6d', '#fcfdbf'], // Magma
  ];

  if (processedLayers.length === 0) {
    return (
      <Card className={`bg-white/80 backdrop-blur-xl border border-purple-300/40 rounded-3xl shadow-lg ${className}`}>
        <CardContent className="p-6">
          <div className="text-center text-gray-400">
            No feature maps available
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <TooltipProvider>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className={className}
      >
        <motion.div className="relative group">
          <div className="absolute inset-0 bg-gradient-to-r from-purple-300/30 via-indigo-300/30 to-blue-300/30 rounded-3xl blur-xl opacity-60 group-hover:opacity-80 transition-opacity duration-500"></div>
          <Card className="relative bg-white/80 backdrop-blur-xl border border-purple-300/40 rounded-3xl shadow-lg">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center space-x-3 text-xl font-playfair font-medium">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-purple-400 to-indigo-500 rounded-full blur-lg opacity-60 animate-pulse"></div>
                <div className="relative w-7 h-7 bg-gradient-to-r from-purple-400 to-indigo-500 rounded-full flex items-center justify-center">
                  <Layers className="w-4 h-4 text-white" />
                </div>
              </div>
              <span className="bg-gradient-to-r from-purple-700 via-indigo-700 to-blue-700 bg-clip-text text-transparent">CNN Feature Maps</span>
              <Tooltip>
                <TooltipTrigger>
                  <Info className="w-4 h-4 text-gray-400" />
                </TooltipTrigger>
                <TooltipContent>
                  <p>Visualize CNN layer activations and feature learning progression</p>
                </TooltipContent>
              </Tooltip>
            </CardTitle>
          </CardHeader>

          <CardContent className="p-6">
            <Tabs value={selectedLayer || Object.keys(groupedLayers)[0]} onValueChange={setSelectedLayer}>
              <TabsList className="grid w-full grid-cols-5 bg-gradient-to-r from-purple-100/70 to-indigo-100/70 backdrop-blur-sm border border-purple-200/50 rounded-xl">
                {Object.keys(groupedLayers).map(groupName => (
                  <TabsTrigger 
                    key={groupName}
                    value={groupName}
                    className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-500 data-[state=active]:to-indigo-500 data-[state=active]:text-white font-crimson data-[state=inactive]:text-gray-700"
                  >
                    {LAYER_DISPLAY_NAMES[groupName] ?? groupName}
                  </TabsTrigger>
                ))}
              </TabsList>

              {Object.entries(groupedLayers).map(([groupName, layers]) => (
                <TabsContent key={groupName} value={groupName} className="mt-6">
                  <div className="space-y-4">
                    {/* Group Statistics */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                      <div className="bg-gradient-to-br from-purple-100/60 to-indigo-100/60 backdrop-blur-sm rounded-2xl p-4 text-center border border-purple-200/40 shadow-sm">
                        <div className="text-sm font-crimson text-purple-600">Layers</div>
                        <div className="text-xl font-playfair font-semibold text-purple-800">{layers.length}</div>
                      </div>
                      <div className="bg-gradient-to-br from-indigo-100/60 to-blue-100/60 backdrop-blur-sm rounded-2xl p-4 text-center border border-indigo-200/40 shadow-sm">
                        <div className="text-sm font-crimson text-indigo-600">Avg Sparsity</div>
                        <div className="text-xl font-playfair font-semibold text-indigo-800">
                          {(layers.reduce((sum, l) => sum + l.statistics.sparsity, 0) / layers.length * 100).toFixed(1)}%
                        </div>
                      </div>
                      <div className="bg-gradient-to-br from-blue-100/60 to-cyan-100/60 backdrop-blur-sm rounded-2xl p-4 text-center border border-blue-200/40 shadow-sm">
                        <div className="text-sm font-crimson text-blue-600">Total Activations</div>
                        <div className="text-xl font-playfair font-semibold text-blue-800">
                          {layers.reduce((sum, l) => sum + l.info.activationCount, 0).toLocaleString()}
                        </div>
                      </div>
                      <div className="bg-gradient-to-br from-cyan-100/60 to-teal-100/60 backdrop-blur-sm rounded-2xl p-4 text-center border border-cyan-200/40 shadow-sm">
                        <div className="text-sm font-crimson text-cyan-600">Avg Activation</div>
                        <div className="text-xl font-playfair font-semibold text-cyan-800">
                          {(layers.reduce((sum, l) => sum + l.statistics.mean, 0) / layers.length).toFixed(3)}
                        </div>
                      </div>
                    </div>

                    {/* Layer List */}
                    <div className="space-y-3">
                      {layers.map((layer) => (
                        <motion.div
                          key={layer.info.name}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          className={`border border-purple-200/40 bg-white/50 backdrop-blur-sm rounded-2xl shadow-sm ${
                            hiddenLayers.has(layer.info.name) ? 'opacity-50' : ''
                          }`}
                        >
                          {/* Layer Header */}
                          <div className="flex items-center justify-between p-5 bg-gradient-to-r from-purple-50/80 to-indigo-50/80 backdrop-blur-sm border-b border-purple-200/30">
                            <div className="flex items-center space-x-3">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => toggleLayerExpansion(layer.info.name)}
                                className="p-1 h-6 w-6 text-purple-600 hover:text-purple-800"
                              >
                                {expandedLayers.has(layer.info.name) ? (
                                  <ChevronDown className="w-4 h-4" />
                                ) : (
                                  <ChevronRight className="w-4 h-4" />
                                )}
                              </Button>
                              
                              <div>
                                <h4 className="font-playfair font-medium text-purple-800">{layer.info.displayName}</h4>
                                <div className="text-sm font-crimson text-purple-600">
                                  Shape: {layer.info.shape.join('×')} • 
                                  Activations: {layer.info.activationCount.toLocaleString()}
                                </div>
                              </div>
                            </div>

                            <div className="flex items-center space-x-2">
                              <div className="text-right text-sm">
                                <div className="font-crimson font-medium text-purple-800">μ: {layer.statistics.mean.toFixed(3)}</div>
                                <div className="font-crimson text-purple-600">σ: {layer.statistics.std.toFixed(3)}</div>
                              </div>
                              
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => toggleLayerVisibility(layer.info.name)}
                                className="p-2 h-8 w-8 text-purple-600 hover:text-purple-800"
                              >
                                {hiddenLayers.has(layer.info.name) ? (
                                  <EyeOff className="w-4 h-4" />
                                ) : (
                                  <Eye className="w-4 h-4" />
                                )}
                              </Button>
                            </div>
                          </div>

                          {/* Expanded Layer Content */}
                          <AnimatePresence>
                            {expandedLayers.has(layer.info.name) && !hiddenLayers.has(layer.info.name) && (
                              <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                transition={{ duration: 0.3 }}
                                className="overflow-hidden"
                              >
                                <div className="p-4 border-t border-white/10">
                                  {/* Statistics Row */}
                                  <div className="grid grid-cols-4 gap-4 mb-4">
                                    <div className="text-center">
                                      <div className="text-xs text-gray-400">Min</div>
                                      <div className="text-sm font-medium text-white">
                                        {layer.statistics.min.toFixed(3)}
                                      </div>
                                    </div>
                                    <div className="text-center">
                                      <div className="text-xs text-gray-400">Max</div>
                                      <div className="text-sm font-medium text-white">
                                        {layer.statistics.max.toFixed(3)}
                                      </div>
                                    </div>
                                    <div className="text-center">
                                      <div className="text-xs text-gray-400">Range</div>
                                      <div className="text-sm font-medium text-white">
                                        {(layer.statistics.max - layer.statistics.min).toFixed(3)}
                                      </div>
                                    </div>
                                    <div className="text-center">
                                      <div className="text-xs text-gray-400">Sparsity</div>
                                      <div className="text-sm font-medium text-white">
                                        {(layer.statistics.sparsity * 100).toFixed(1)}%
                                      </div>
                                    </div>
                                  </div>

                                  {/* Heatmap */}
                                  <CustomHeatmap
                                    data={layer.heatmapData}
                                    title={`${layer.info.displayName} (${layer.info.shape.join('×')})`}
                                    colorScheme={COLOR_SCHEMES[0]}
                                    className="w-full"
                                  />
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                </TabsContent>
              ))}
            </Tabs>
          </CardContent>
        </Card>
        </motion.div>
      </motion.div>
    </TooltipProvider>
  );
}

export default FeatureMapsVisualization;
