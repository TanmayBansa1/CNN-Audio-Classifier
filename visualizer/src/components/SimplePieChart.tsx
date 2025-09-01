'use client';

import { useMemo } from 'react';
import { motion } from 'framer-motion';

interface SimplePieChartProps {
  data: Array<{ name: string; value: number; color: string }>;
  className?: string;
  size?: number;
}

export function SimplePieChart({ data, className = '', size = 200 }: SimplePieChartProps) {
  const { paths, total } = useMemo(() => {
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
    
    return { paths, total };
  }, [data, size]);

  return (
    <div className={`bg-black/30 rounded-lg p-4 ${className}`}>
      <div className="flex items-center justify-center">
        <svg width={size} height={size} className="transform -rotate-90">
          {paths.map((segment, index) => (
            <motion.path
              key={segment.name}
              d={segment.pathData}
              fill={segment.color}
              stroke="rgba(255,255,255,0.1)"
              strokeWidth="1"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: index * 0.1, duration: 0.5 }}
              className="hover:brightness-110 cursor-pointer"
            />
          ))}
        </svg>
      </div>
      
      {/* Legend */}
      <div className="mt-4 space-y-2">
        {paths.map((segment) => (
          <div key={segment.name} className="flex items-center justify-between text-sm">
            <div className="flex items-center space-x-2">
              <div 
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: segment.color }}
              />
              <span className="text-gray-300">{segment.name}</span>
            </div>
            <span className="text-white font-medium">
              {segment.percentage.toFixed(1)}%
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

