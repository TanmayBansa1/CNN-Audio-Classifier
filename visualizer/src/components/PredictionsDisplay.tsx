'use client';

import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, Award, BarChart3, Target } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '~/components/ui/card';
import { Progress } from '~/components/ui/progress';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '~/components/ui/tooltip';
import type { Prediction } from '~/lib/types';
import { SimpleBarChart } from './SimpleBarChart';
import { SimplePieChart } from './SimplePieChart';

interface PredictionsDisplayProps {
  predictions: Prediction[];
  _allClassProbabilities?: Record<string, number>;
  className?: string;
}

interface ProcessedPrediction extends Prediction {
  rank: number;
  confidenceLevel: 'high' | 'medium' | 'low';
  color: string;
}

interface ConfidenceMetrics {
  entropy: number;
  maxConfidence: number;
  confidenceGap: number;
  distributionSpread: number;
}

const CONFIDENCE_COLORS = {
  high: '#10b981', // emerald-500
  medium: '#f59e0b', // amber-500
  low: '#ef4444', // red-500
};

const CHART_COLORS = [
  '#3b82f6', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444',
  '#06b6d4', '#84cc16', '#f97316', '#ec4899', '#6366f1'
];

export function PredictionsDisplay({ 
  predictions, 
  _allClassProbabilities,
  className = '' 
}: PredictionsDisplayProps) {
  
  // Process predictions with additional metadata
  const processedPredictions = useMemo((): ProcessedPrediction[] => {
    return predictions.map((pred, index) => {
      let confidenceLevel: 'high' | 'medium' | 'low';
      
      if (pred.confidence > 0.7) confidenceLevel = 'high';
      else if (pred.confidence > 0.4) confidenceLevel = 'medium';
      else confidenceLevel = 'low';

      return {
        ...pred,
        rank: index + 1,
        confidenceLevel,
        color: CHART_COLORS[index % CHART_COLORS.length] ?? '#6b7280',
      };
    });
  }, [predictions]);

  // Calculate confidence metrics
  const confidenceMetrics = useMemo((): ConfidenceMetrics => {
    const confidences = predictions.map(p => p.confidence);
    const maxConfidence = Math.max(...confidences);
    const secondHighest = confidences.length > 1 ? 
      Math.max(...confidences.filter(c => c !== maxConfidence)) : 0;
    
    // Calculate entropy (uncertainty measure)
    const entropy = -confidences.reduce((sum, p) => {
      if (p === 0) return sum;
      return sum + p * Math.log2(p);
    }, 0);

    // Confidence gap between top 2 predictions
    const confidenceGap = maxConfidence - secondHighest;

    // Distribution spread
    const mean = confidences.reduce((sum, c) => sum + c, 0) / confidences.length;
    const variance = confidences.reduce((sum, c) => sum + Math.pow(c - mean, 2), 0) / confidences.length;
    const distributionSpread = Math.sqrt(variance);

    return {
      entropy,
      maxConfidence,
      confidenceGap,
      distributionSpread,
    };
  }, [predictions]);

  // Prepare data for bar chart
  const barChartData = useMemo(() => {
    return processedPredictions.map(pred => ({
      label: pred.class.replace(/_/g, ' '),
      value: pred.confidence * 100,
      color: pred.color,
    }));
  }, [processedPredictions]);

  // Prepare data for pie chart (top 5 + others)
  const pieChartData = useMemo(() => {
    const topPredictions = processedPredictions.slice(0, 5);
    const othersSum = processedPredictions.slice(5).reduce((sum, p) => sum + p.confidence, 0);
    
    const data = topPredictions.map(pred => ({
      name: pred.class.replace(/_/g, ' '),
      value: pred.confidence * 100,
      color: pred.color,
    }));

    if (othersSum > 0) {
      data.push({
        name: 'Others',
        value: othersSum * 100,
        color: '#6b7280', // gray-500
      });
    }

    return data;
  }, [processedPredictions]);

  const getConfidenceDescription = (level: 'high' | 'medium' | 'low'): string => {
    switch (level) {
      case 'high': return 'High confidence prediction';
      case 'medium': return 'Moderate confidence prediction';
      case 'low': return 'Low confidence prediction';
    }
  };

  const getModelPerformanceStatus = (): { status: string; color: string; description: string } => {
    const topConfidence = confidenceMetrics.maxConfidence;
    const gap = confidenceMetrics.confidenceGap;

    if (topConfidence > 0.8 && gap > 0.3) {
      return {
        status: 'Excellent',
        color: 'text-emerald-400',
        description: 'High confidence with clear distinction'
      };
    } else if (topConfidence > 0.6 && gap > 0.2) {
      return {
        status: 'Good',
        color: 'text-blue-400',
        description: 'Good confidence with reasonable distinction'
      };
    } else if (topConfidence > 0.4) {
      return {
        status: 'Uncertain',
        color: 'text-amber-400',
        description: 'Moderate confidence, consider multiple predictions'
      };
    } else {
      return {
        status: 'Low Confidence',
        color: 'text-red-400',
        description: 'Low confidence, model is uncertain'
      };
    }
  };

  const performanceStatus = getModelPerformanceStatus();

  return (
    <TooltipProvider>
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className={`space-y-8 ${className}`}
      >
        {/* Header Card with Overall Metrics */}
        <motion.div 
          className="relative group"
          whileHover={{ y: -5 }}
          transition={{ duration: 0.3 }}
        >
          <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/20 via-blue-500/20 to-purple-500/20 rounded-3xl blur-xl opacity-50 group-hover:opacity-75 transition-opacity duration-500"></div>
          <Card className="relative bg-white backdrop-blur-xl border border-white/20 rounded-3xl shadow-2xl">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center space-x-3 text-2xl font-playfair font-medium">
                <div className="relative">
                  <div className="absolute inset-0 bg-gradient-to-r from-emerald-400 to-blue-500 rounded-full blur-lg opacity-75 animate-pulse"></div>
                  <div className="relative w-8 h-8 bg-gradient-to-r from-emerald-400 to-blue-500 rounded-full flex items-center justify-center">
                    <Target className="w-5 h-5 text-white" />
                  </div>
                </div>
                <span className="bg-gradient-to-r from-white via-blue-100 to-emerald-200 bg-clip-text text-green-300">
                  Classification Results
                </span>
              </CardTitle>
            </CardHeader>
          <CardContent className="p-8">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              <motion.div 
                className="text-center group"
                whileHover={{ scale: 1.05 }}
                transition={{ duration: 0.2 }}
              >
                <div className="relative mb-2">
                  <div className="text-3xl font-poppins font-bold text-transparent bg-gradient-to-r from-emerald-400 to-blue-500 bg-clip-text">
                    {(confidenceMetrics.maxConfidence * 100).toFixed(1)}%
                  </div>
                </div>
                <div className="text-sm font-medium text-emerald-300">Top Confidence</div>
              </motion.div>
              
              <motion.div 
                className="text-center group"
                whileHover={{ scale: 1.05 }}
                transition={{ duration: 0.2 }}
              >
                <div className="relative mb-2">
                  <div className={`text-3xl font-poppins font-bold ${performanceStatus.color}`}>
                    {performanceStatus.status}
                  </div>
                </div>
                <div className="text-sm font-medium text-blue-300">Model Confidence</div>
              </motion.div>
              
              <motion.div 
                className="text-center group"
                whileHover={{ scale: 1.05 }}
                transition={{ duration: 0.2 }}
              >
                <div className="relative mb-2">
                  <div className="text-3xl font-poppins font-bold text-transparent bg-gradient-to-r from-purple-400 to-pink-500 bg-clip-text">
                    {(confidenceMetrics.confidenceGap * 100).toFixed(1)}%
                  </div>
                </div>
                <div className="text-sm font-medium text-purple-300">Confidence Gap</div>
              </motion.div>
              
              <motion.div 
                className="text-center group"
                whileHover={{ scale: 1.05 }}
                transition={{ duration: 0.2 }}
              >
                <div className="relative mb-2">
                  <div className="text-3xl font-poppins font-bold text-transparent bg-gradient-to-r from-pink-400 to-rose-500 bg-clip-text">
                    {confidenceMetrics.entropy.toFixed(2)}
                  </div>
                </div>
                <div className="text-sm font-medium text-pink-300">Entropy</div>
              </motion.div>
            </div>

            <div className="mt-6 p-4 bg-gradient-to-r from-orange-100/60 to-rose-100/60 backdrop-blur-sm rounded-xl border border-orange-200/50">
              <p className="text-sm font-crimson text-gray-700 text-center font-medium">
                {performanceStatus.description}
              </p>
            </div>
          </CardContent>
        </Card>
        </motion.div>

        {/* Top Predictions List */}
        <motion.div 
          className="relative group"
          whileHover={{ y: -2 }}
          transition={{ duration: 0.3 }}
        >
          <div className="absolute inset-0 bg-gradient-to-r from-orange-300/30 via-rose-300/30 to-amber-300/30 rounded-3xl blur-xl opacity-60 group-hover:opacity-80 transition-opacity duration-500"></div>
          <Card className="relative bg-white/80 backdrop-blur-xl border border-orange-300/40 rounded-3xl shadow-lg">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center space-x-3 text-xl font-playfair font-medium">
                <div className="relative">
                  <div className="absolute inset-0 bg-gradient-to-r from-orange-400 to-rose-500 rounded-full blur-lg opacity-60 animate-pulse"></div>
                  <div className="relative w-7 h-7 bg-gradient-to-r from-orange-400 to-rose-500 rounded-full flex items-center justify-center">
                    <Award className="w-4 h-4 text-white" />
                  </div>
                </div>
                <span className="bg-gradient-to-r from-orange-700 via-rose-700 to-amber-700 bg-clip-text text-transparent">
                  Top Predictions
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-4">
                {processedPredictions.map((pred, index) => (
                  <motion.div
                    key={pred.class}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="flex items-center space-x-4 p-4 bg-gradient-to-r from-orange-100/70 to-rose-100/70 backdrop-blur-sm rounded-2xl border border-orange-200/50 shadow-sm"
                  >
                  <div className="flex-shrink-0">
                    <div 
                      className="w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm"
                      style={{ backgroundColor: pred.color }}
                    >
                      {pred.rank}
                    </div>
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="text-gray-800 font-playfair font-medium truncate">
                        {pred.class.replace(/_/g, ' ').toUpperCase()}
                      </h4>
                      <div className="flex items-center space-x-2">
                        <span className="text-lg font-playfair font-semibold text-gray-800">
                          {(pred.confidence * 100).toFixed(1)}%
                        </span>
                        <Tooltip>
                          <TooltipTrigger>
                            <div 
                              className="w-3 h-3 rounded-full"
                              style={{ backgroundColor: CONFIDENCE_COLORS[pred.confidenceLevel] }}
                            />
                          </TooltipTrigger>
                          <TooltipContent>
                            {getConfidenceDescription(pred.confidenceLevel)}
                          </TooltipContent>
                        </Tooltip>
                      </div>
                    </div>
                    
                    <Progress 
                      value={pred.confidence * 100} 
                      className="h-2"
                    />
                  </div>
                </motion.div>
              ))}
            </div>
          </CardContent>
        </Card>
        </motion.div>

        {/* Visualization Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Bar Chart */}
          <motion.div 
            className="relative group"
            whileHover={{ y: -2 }}
            transition={{ duration: 0.3 }}
          >
            <div className="absolute inset-0 bg-gradient-to-r from-blue-300/30 via-indigo-300/30 to-purple-300/30 rounded-3xl blur-xl opacity-60 group-hover:opacity-80 transition-opacity duration-500"></div>
            <Card className="relative bg-white/80 backdrop-blur-xl border border-blue-300/40 rounded-3xl shadow-lg">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center space-x-3 text-xl font-playfair font-medium">
                  <div className="relative">
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-indigo-500 rounded-full blur-lg opacity-60 animate-pulse"></div>
                    <div className="relative w-7 h-7 bg-gradient-to-r from-blue-400 to-indigo-500 rounded-full flex items-center justify-center">
                      <BarChart3 className="w-4 h-4 text-white" />
                    </div>
                  </div>
                  <span className="bg-gradient-to-r from-blue-700 via-indigo-700 to-purple-700 bg-clip-text text-transparent">
                    Confidence Distribution
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <SimpleBarChart 
                  data={barChartData}
                  height={250}
                  className="w-full"
                />
              </CardContent>
            </Card>
          </motion.div>

          {/* Pie Chart */}
          <motion.div 
            className="relative group"
            whileHover={{ y: -2 }}
            transition={{ duration: 0.3 }}
          >
            <div className="absolute inset-0 bg-gradient-to-r from-emerald-300/30 via-teal-300/30 to-cyan-300/30 rounded-3xl blur-xl opacity-60 group-hover:opacity-80 transition-opacity duration-500"></div>
            <Card className="relative bg-white/80 backdrop-blur-xl border border-emerald-300/40 rounded-3xl shadow-lg">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center space-x-3 text-xl font-playfair font-medium">
                  <div className="relative">
                    <div className="absolute inset-0 bg-gradient-to-r from-emerald-400 to-teal-500 rounded-full blur-lg opacity-60 animate-pulse"></div>
                    <div className="relative w-7 h-7 bg-gradient-to-r from-emerald-400 to-teal-500 rounded-full flex items-center justify-center">
                      <TrendingUp className="w-4 h-4 text-white" />
                    </div>
                  </div>
                  <span className="bg-gradient-to-r from-emerald-700 via-teal-700 to-cyan-700 bg-clip-text text-transparent">
                    Prediction Breakdown
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <SimplePieChart 
                  data={pieChartData}
                  size={200}
                  className="w-full"
                />
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </motion.div>
    </TooltipProvider>
  );
}
