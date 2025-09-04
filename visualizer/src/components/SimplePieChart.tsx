'use client';

import { useMemo } from 'react';
import { motion } from 'framer-motion';

interface SimplePieChartProps {
  data: Array<{ name: string; value: number; color: string }>;
  className?: string;
  size?: number;
}

export function SimplePieChart({ data, className = '', size = 200 }: SimplePieChartProps) {
  const { paths } = useMemo(() => {
    const total = data.reduce((sum, item) => sum + item.value, 0);
    let currentAngle = 0;
    
    const paths = data.map(item => {
      const percentage = item.value / total;
      const angle = percentage * 360;
      const startAngle = currentAngle;
      const endAngle = currentAngle + angle;
      
      currentAngle += angle;
      
      // Calculate path for SVG arc
      const radius = size / 2 - 10;
      const centerX = size / 2;
      const centerY = size / 2;
      
      const startAngleRad = (startAngle - 90) * (Math.PI / 180);
      const endAngleRad = (endAngle - 90) * (Math.PI / 180);
      
      const x1 = centerX + radius * Math.cos(startAngleRad);
      const y1 = centerY + radius * Math.sin(startAngleRad);
      const x2 = centerX + radius * Math.cos(endAngleRad);
      const y2 = centerY + radius * Math.sin(endAngleRad);
      
      const largeArcFlag = angle > 180 ? 1 : 0;
      
      const pathData = [
        `M ${centerX} ${centerY}`,
        `L ${x1} ${y1}`,
        `A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2} ${y2}`,
        'Z'
      ].join(' ');
      
      return {
        ...item,
        pathData,
        percentage: percentage * 100,
        startAngle,
        endAngle
      };
    });
    
    return { paths };
  }, [data, size]);

  return (
    <div className={`bg-gradient-to-br from-emerald-50/60 to-teal-50/60 backdrop-blur-sm rounded-2xl p-6 border border-emerald-200/40 ${className}`}>
      <div className="flex items-center justify-center">
        <svg width={size} height={size} className="transform -rotate-90 drop-shadow-sm">
          {paths.map((segment, index) => (
            <motion.path
              key={segment.name}
              d={segment.pathData}
              fill={segment.color}
              stroke="rgba(255,255,255,0.3)"
              strokeWidth="2"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: index * 0.1, duration: 0.5 }}
              className="hover:brightness-110 cursor-pointer"
            />
          ))}
        </svg>
      </div>
      
      {/* Legend */}
      <div className="mt-6 space-y-3">
        {paths.map((segment) => (
          <div key={segment.name} className="flex items-center justify-between text-sm">
            <div className="flex items-center space-x-3">
              <div 
                className="w-4 h-4 rounded-full shadow-sm"
                style={{ backgroundColor: segment.color }}
              />
              <span className="font-crimson text-gray-700">{segment.name}</span>
            </div>
            <span className="font-crimson font-medium text-gray-800">
              {segment.percentage.toFixed(1)}%
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

