'use client';

import { useMemo } from 'react';
import { motion } from 'framer-motion';

interface SimpleBarChartProps {
  data: Array<{ label: string; value: number; color: string }>;
  className?: string;
  height?: number;
}

export function SimpleBarChart({ data, className = '', height = 200 }: SimpleBarChartProps) {
  const maxValue = useMemo(() => Math.max(...data.map(d => d.value)), [data]);

  return (
    <div className={`bg-black/30 rounded-lg p-4 ${className}`}>
      <div className="flex items-end justify-between space-x-2" style={{ height: `${height}px` }}>
        {data.map((item, index) => {
          const barHeight = (item.value / maxValue) * (height - 40); // Leave space for labels
          
          return (
            <div key={item.label} className="flex-1 flex flex-col items-center">
              <motion.div
                initial={{ height: 0 }}
                animate={{ height: barHeight }}
                transition={{ delay: index * 0.1, duration: 0.6, ease: 'easeOut' }}
                className="w-full rounded-t-md flex items-end justify-center relative"
                style={{ backgroundColor: item.color }}
              >
                <span className="text-white text-xs font-medium mb-1">
                  {item.value.toFixed(1)}%
                </span>
              </motion.div>
              
              <div className="mt-2 text-center">
                <span className="text-xs text-gray-300 break-words leading-tight">
                  {item.label.replace(/_/g, ' ').toUpperCase()}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

