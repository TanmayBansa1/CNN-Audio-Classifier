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
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className={`space-y-6 ${className}`}
      >
        {/* Header Card with Overall Metrics */}
        <Card className="bg-white/10 backdrop-blur-sm border-white/20">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2 text-xl font-bold text-white">
              <Target className="w-6 h-6" />
              <span>Classification Results</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-white">
                  {(confidenceMetrics.maxConfidence * 100).toFixed(1)}%
                </div>
                <div className="text-sm text-gray-400">Top Confidence</div>
              </div>
              
              <div className="text-center">
                <div className={`text-2xl font-bold ${performanceStatus.color}`}>
                  {performanceStatus.status}
                </div>
                <div className="text-sm text-gray-400">Model Confidence</div>
              </div>
              
              <div className="text-center">
                <div className="text-2xl font-bold text-white">
                  {(confidenceMetrics.confidenceGap * 100).toFixed(1)}%
                </div>
                <div className="text-sm text-gray-400">Confidence Gap</div>
              </div>
              
              <div className="text-center">
                <div className="text-2xl font-bold text-white">
                  {confidenceMetrics.entropy.toFixed(2)}
                </div>
                <div className="text-sm text-gray-400">Entropy</div>
              </div>
            </div>

            <div className="mt-4 p-3 bg-black/30 rounded-lg">
              <p className="text-sm text-gray-300 text-center">
                {performanceStatus.description}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Top Predictions List */}
        <Card className="bg-white/10 backdrop-blur-sm border-white/20">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2 text-lg font-bold text-white">
              <Award className="w-5 h-5" />
              <span>Top Predictions</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {processedPredictions.map((pred, index) => (
                <motion.div
                  key={pred.class}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="flex items-center space-x-4 p-4 bg-black/30 rounded-lg"
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
                      <h4 className="text-white font-medium truncate">
                        {pred.class.replace(/_/g, ' ').toUpperCase()}
                      </h4>
                      <div className="flex items-center space-x-2">
                        <span className="text-lg font-bold text-white">
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

        {/* Visualization Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Bar Chart */}
          <Card className="bg-white/10 backdrop-blur-sm border-white/20">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2 text-lg font-bold text-white">
                <BarChart3 className="w-5 h-5" />
                <span>Confidence Distribution</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <SimpleBarChart 
                data={barChartData}
                height={250}
                className="w-full"
              />
            </CardContent>
          </Card>

          {/* Pie Chart */}
          <Card className="bg-white/10 backdrop-blur-sm border-white/20">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2 text-lg font-bold text-white">
                <TrendingUp className="w-5 h-5" />
                <span>Prediction Breakdown</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <SimplePieChart 
                data={pieChartData}
                size={200}
                className="w-full"
              />
            </CardContent>
          </Card>
        </div>
      </motion.div>
    </TooltipProvider>
  );
}
