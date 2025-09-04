'use client';

import { useMemo } from 'react';
import { motion } from 'framer-motion';

interface SimpleBarChartProps {
  data: Array<{ label: string; value: number; color: string }>;
  className?: string;
  height?: number;
}

function SimpleBarChart({ data, className = '', height = 200 }: SimpleBarChartProps) {
  const maxValue = useMemo(() => Math.max(...data.map(d => d.value)), [data]);

  return (
    <div className={`bg-gradient-to-br from-orange-50/60 to-rose-50/60 backdrop-blur-sm rounded-2xl p-6 border border-orange-200/40 ${className}`}>
      <div className="flex items-end justify-between space-x-3" style={{ height: `${height}px` }}>
        {data.map((item, index) => {
          const barHeight = (item.value / maxValue) * (height - 40); // Leave space for labels
          
          return (
            <div key={item.label} className="flex-1 flex flex-col items-center">
              <motion.div
                initial={{ height: 0 }}
                animate={{ height: barHeight }}
                transition={{ delay: index * 0.1, duration: 0.6, ease: 'easeOut' }}
                className="w-full rounded-t-lg flex items-end justify-center relative shadow-sm"
                style={{ backgroundColor: item.color }}
              >
                <span className="text-white text-xs font-crimson font-medium mb-2 drop-shadow-sm">
                  {item.value.toFixed(1)}%
                </span>
              </motion.div>
              
              <div className="mt-3 text-center">
                <span className="text-xs font-crimson text-gray-700 break-words leading-tight">
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

export default SimpleBarChart;

