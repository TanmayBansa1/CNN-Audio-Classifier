'use client';

import { motion } from 'framer-motion';

interface ResultsSkeletonProps {
  className?: string;
}

export default function ResultsSkeleton({ className = '' }: ResultsSkeletonProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className={`space-y-8 ${className}`}
    >
      {/* Predictions Skeleton */}
      <div className="relative">
        <div className="absolute inset-0 bg-gradient-to-r from-emerald-300/20 via-blue-300/20 to-purple-300/20 rounded-3xl blur-xl opacity-60"></div>
        <div className="relative bg-white/80 backdrop-blur-xl border border-white/20 rounded-3xl shadow-lg p-8">
          {/* Header */}
          <div className="flex items-center space-x-3 mb-6">
            <div className="w-8 h-8 bg-gradient-to-r from-emerald-200 to-blue-200 rounded-full animate-pulse"></div>
            <div className="h-6 bg-gradient-to-r from-gray-200 to-gray-300 rounded-lg w-48 animate-pulse"></div>
          </div>
          
          {/* Metrics Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-8">
            {Array.from({ length: 4 }, (_, i) => (
              <div key={i} className="text-center space-y-2">
                <div className="h-8 bg-gradient-to-r from-gray-200 to-gray-300 rounded-lg animate-pulse"></div>
                <div className="h-4 bg-gray-200 rounded w-20 mx-auto animate-pulse"></div>
              </div>
            ))}
          </div>
          
          {/* Description */}
          <div className="h-12 bg-gradient-to-r from-orange-100 to-rose-100 rounded-xl animate-pulse"></div>
        </div>
      </div>

      {/* Top Predictions Skeleton */}
      <div className="relative">
        <div className="absolute inset-0 bg-gradient-to-r from-orange-300/20 via-rose-300/20 to-amber-300/20 rounded-3xl blur-xl opacity-60"></div>
        <div className="relative bg-white/80 backdrop-blur-xl border border-orange-300/40 rounded-3xl shadow-lg p-6">
          {/* Header */}
          <div className="flex items-center space-x-3 mb-6">
            <div className="w-7 h-7 bg-gradient-to-r from-orange-200 to-rose-200 rounded-full animate-pulse"></div>
            <div className="h-5 bg-gradient-to-r from-gray-200 to-gray-300 rounded-lg w-36 animate-pulse"></div>
          </div>
          
          {/* Prediction Items */}
          <div className="space-y-4">
            {Array.from({ length: 3 }, (_, i) => (
              <div key={i} className="flex items-center space-x-4 p-4 bg-gradient-to-r from-orange-100/50 to-rose-100/50 rounded-2xl">
                <div className="w-8 h-8 bg-orange-300 rounded-full animate-pulse"></div>
                <div className="flex-1 space-y-2">
                  <div className="flex justify-between items-center">
                    <div className="h-4 bg-gray-300 rounded w-32 animate-pulse"></div>
                    <div className="flex items-center space-x-2">
                      <div className="h-4 bg-gray-300 rounded w-12 animate-pulse"></div>
                      <div className="w-3 h-3 bg-green-300 rounded-full animate-pulse"></div>
                    </div>
                  </div>
                  <div className="h-2 bg-gray-200 rounded-full animate-pulse"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Audio Analysis Grid Skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Audio Player Skeleton */}
        <div className="relative">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-300/20 via-indigo-300/20 to-purple-300/20 rounded-3xl blur-xl opacity-60"></div>
          <div className="relative bg-white/80 backdrop-blur-xl border border-blue-300/40 rounded-3xl shadow-lg p-6">
            {/* Header */}
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-7 h-7 bg-gradient-to-r from-blue-200 to-indigo-200 rounded-full animate-pulse"></div>
              <div className="h-5 bg-gradient-to-r from-gray-200 to-gray-300 rounded-lg w-28 animate-pulse"></div>
            </div>
            
            {/* Waveform Area */}
            <div className="h-64 bg-gradient-to-br from-blue-100/50 to-indigo-100/50 rounded-2xl mb-4 animate-pulse"></div>
            
            {/* Controls */}
            <div className="flex items-center justify-center space-x-4">
              <div className="w-12 h-12 bg-blue-300 rounded-full animate-pulse"></div>
              <div className="flex-1 h-2 bg-gray-200 rounded-full animate-pulse"></div>
              <div className="w-16 h-4 bg-gray-200 rounded animate-pulse"></div>
            </div>
          </div>
        </div>

        {/* Spectrogram Skeleton */}
        <div className="relative">
          <div className="absolute inset-0 bg-gradient-to-r from-purple-300/20 via-pink-300/20 to-rose-300/20 rounded-3xl blur-xl opacity-60"></div>
          <div className="relative bg-white/80 backdrop-blur-xl border border-purple-300/40 rounded-3xl shadow-lg p-6">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className="w-7 h-7 bg-gradient-to-r from-purple-200 to-pink-200 rounded-full animate-pulse"></div>
                <div className="h-5 bg-gradient-to-r from-gray-200 to-gray-300 rounded-lg w-36 animate-pulse"></div>
              </div>
              <div className="flex space-x-2">
                {Array.from({ length: 4 }, (_, i) => (
                  <div key={i} className="w-8 h-8 bg-gray-200 rounded animate-pulse"></div>
                ))}
              </div>
            </div>
            
            {/* Controls */}
            <div className="flex items-center space-x-4 mb-6">
              <div className="h-4 bg-gray-200 rounded w-24 animate-pulse"></div>
              <div className="flex-1 h-2 bg-gray-200 rounded-full animate-pulse"></div>
              <div className="h-4 bg-gray-200 rounded w-12 animate-pulse"></div>
            </div>
            
            {/* Spectrogram Area */}
            <div className="h-64 bg-gradient-to-br from-purple-100/50 to-pink-100/50 rounded-2xl animate-pulse"></div>
          </div>
        </div>
      </div>

      {/* Feature Maps Skeleton */}
      <div className="relative">
        <div className="absolute inset-0 bg-gradient-to-r from-purple-300/20 via-indigo-300/20 to-blue-300/20 rounded-3xl blur-xl opacity-60"></div>
        <div className="relative bg-white/80 backdrop-blur-xl border border-purple-300/40 rounded-3xl shadow-lg p-6">
          {/* Header */}
          <div className="flex items-center space-x-3 mb-6">
            <div className="w-7 h-7 bg-gradient-to-r from-purple-200 to-indigo-200 rounded-full animate-pulse"></div>
            <div className="h-5 bg-gradient-to-r from-gray-200 to-gray-300 rounded-lg w-40 animate-pulse"></div>
          </div>
          
          {/* Tabs */}
          <div className="grid grid-cols-5 gap-2 mb-6">
            {Array.from({ length: 5 }, (_, i) => (
              <div key={i} className="h-10 bg-gradient-to-r from-purple-100 to-indigo-100 rounded-xl animate-pulse"></div>
            ))}
          </div>
          
          {/* Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            {Array.from({ length: 4 }, (_, i) => (
              <div key={i} className="bg-gradient-to-br from-purple-100/60 to-indigo-100/60 rounded-2xl p-4 text-center animate-pulse">
                <div className="h-3 bg-gray-200 rounded w-16 mx-auto mb-2"></div>
                <div className="h-6 bg-gray-300 rounded mx-auto"></div>
              </div>
            ))}
          </div>
          
          {/* Layer Items */}
          <div className="space-y-3">
            {Array.from({ length: 3 }, (_, i) => (
              <div key={i} className="border border-purple-200/40 bg-white/50 rounded-2xl p-5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-6 h-6 bg-purple-300 rounded animate-pulse"></div>
                    <div className="space-y-1">
                      <div className="h-4 bg-gray-300 rounded w-32 animate-pulse"></div>
                      <div className="h-3 bg-gray-200 rounded w-48 animate-pulse"></div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="space-y-1 text-right">
                      <div className="h-3 bg-gray-200 rounded w-16 animate-pulse"></div>
                      <div className="h-3 bg-gray-200 rounded w-12 animate-pulse"></div>
                    </div>
                    <div className="w-8 h-8 bg-purple-300 rounded animate-pulse"></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
