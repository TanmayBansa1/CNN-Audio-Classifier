'use client';

import { useEffect, useRef, useState, useMemo, useCallback } from 'react';
import * as d3 from 'd3';
import { motion } from 'framer-motion';

interface CustomHeatmapProps {
  data: number[][];
  title: string;
  width?: number;
  height?: number;
  colorScheme?: string[];
  className?: string;
}

const DEFAULT_COLOR_SCHEME = ['#440154', '#31688e', '#35b779', '#fde725']; // Viridis

export function CustomHeatmap({ 
  data, 
  title, 
  width = 400, 
  height = 300,
  colorScheme = DEFAULT_COLOR_SCHEME,
  className = '' 
}: CustomHeatmapProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width, height });
  const [hoveredCell, setHoveredCell] = useState<{ x: number; y: number; value: number } | null>(null);

  // Process data and create color scale
  const { processedData, colorScale, stats } = useMemo(() => {
    if (!data || data.length === 0) return { processedData: [], colorScale: null, stats: null };

    const flatData = data.flat();
    const minVal = Math.min(...flatData);
    const maxVal = Math.max(...flatData);
    const mean = flatData.reduce((sum, val) => sum + val, 0) / flatData.length;

    const colorScale = d3.scaleSequential()
      .domain([minVal, maxVal])
      .interpolator(d3.interpolateRgbBasis(colorScheme));

    return {
      processedData: data,
      colorScale,
      stats: { min: minVal, max: maxVal, mean }
    };
  }, [data, colorScheme]);

  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        setDimensions({
          width: rect.width - 40, // Account for padding
          height: Math.min(300, rect.width * 0.6) // Maintain aspect ratio
        });
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Render heatmap
  const renderHeatmap = useCallback(() => {
    if (!svgRef.current || !processedData || !colorScale) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    const margin = { top: 20, right: 60, bottom: 40, left: 60 };
    const innerWidth = dimensions.width - margin.left - margin.right;
    const innerHeight = dimensions.height - margin.top - margin.bottom;

    const rows = processedData.length;
    const cols = processedData[0]?.length ?? 0;

    if (rows === 0 || cols === 0) return;

    const cellWidth = innerWidth / cols;
    const cellHeight = innerHeight / rows;

    const g = svg.append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    // Create cells
    processedData.forEach((row, rowIndex) => {
      row.forEach((value, colIndex) => {
        if (typeof value !== 'number' || isNaN(value)) return;

        g.append('rect')
          .attr('x', colIndex * cellWidth)
          .attr('y', rowIndex * cellHeight)
          .attr('width', cellWidth)
          .attr('height', cellHeight)
          .attr('fill', colorScale(value))
          .attr('stroke', 'rgba(255,255,255,0.1)')
          .attr('stroke-width', 0.5)
          .style('cursor', 'crosshair')
          .on('mouseover', function() {
            // Highlight cell
            d3.select(this)
              .attr('stroke', 'white')
              .attr('stroke-width', 2);
            
            setHoveredCell({
              x: colIndex,
              y: rowIndex,
              value: value
            });
          })
          .on('mouseout', function() {
            // Reset cell
            d3.select(this)
              .attr('stroke', 'rgba(255,255,255,0.1)')
              .attr('stroke-width', 0.5);
            
            setHoveredCell(null);
          });
      });
    });

    // Add axes
    const xScale = d3.scaleLinear()
      .domain([0, cols])
      .range([0, innerWidth]);

    const yScale = d3.scaleLinear()
      .domain([0, rows])
      .range([0, innerHeight]);

    // X axis
    g.append('g')
      .attr('transform', `translate(0,${innerHeight})`)
      .call(d3.axisBottom(xScale).ticks(Math.min(10, cols)))
      .selectAll('text')
      .style('fill', 'white')
      .style('font-size', '12px');

    // Y axis
    g.append('g')
      .call(d3.axisLeft(yScale).ticks(Math.min(10, rows)))
      .selectAll('text')
      .style('fill', 'white')
      .style('font-size', '12px');

    // Axis lines
    g.selectAll('.domain, .tick line')
      .style('stroke', 'rgba(255,255,255,0.3)');

    // Add labels
    g.append('text')
      .attr('transform', 'rotate(-90)')
      .attr('y', 0 - margin.left)
      .attr('x', 0 - (innerHeight / 2))
      .attr('dy', '1em')
      .style('text-anchor', 'middle')
      .style('fill', 'white')
      .style('font-size', '14px')
      .text('Height');

    g.append('text')
      .attr('transform', `translate(${innerWidth / 2}, ${innerHeight + margin.bottom})`)
      .style('text-anchor', 'middle')
      .style('fill', 'white')
      .style('font-size', '14px')
      .text('Width');

    // Color scale legend
    const legendWidth = 20;
    const legendHeight = innerHeight;
    const legendScale = d3.scaleLinear()
      .domain(colorScale.domain())
      .range([legendHeight, 0]);

    const legend = g.append('g')
      .attr('transform', `translate(${innerWidth + 10}, 0)`);

    // Create gradient for legend
    const defs = svg.append('defs');
    const gradient = defs.append('linearGradient')
      .attr('id', 'legend-gradient')
      .attr('x1', '0%')
      .attr('y1', '100%')
      .attr('x2', '0%')
      .attr('y2', '0%');

    const steps = 10;
    for (let i = 0; i <= steps; i++) {
      const value = stats.min + (stats.max - stats.min) * (i / steps);
      gradient.append('stop')
        .attr('offset', `${i * 10}%`)
        .attr('stop-color', colorScale(value));
    }

    legend.append('rect')
      .attr('width', legendWidth)
      .attr('height', legendHeight)
      .style('fill', 'url(#legend-gradient)')
      .attr('stroke', 'rgba(255,255,255,0.3)');

    // Legend axis
    legend.append('g')
      .attr('transform', `translate(${legendWidth}, 0)`)
      .call(d3.axisRight(legendScale).ticks(5))
      .selectAll('text')
      .style('fill', 'white')
      .style('font-size', '10px');

    legend.selectAll('.domain, .tick line')
      .style('stroke', 'rgba(255,255,255,0.3)');

  }, [processedData, colorScale, dimensions, stats]);

  useEffect(() => {
    renderHeatmap();
  }, [renderHeatmap]);

  if (!processedData || !stats) {
    return (
      <div className={`bg-black/30 rounded-lg p-4 ${className}`}>
        <div className="text-center text-gray-400">No data to display</div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className={`relative ${className}`}
    >
      {/* Title */}
      <div className="text-center mb-3">
        <h4 className="font-playfair font-medium text-purple-800">{title}</h4>
        <div className="text-xs font-crimson text-purple-600">
          {processedData.length}×{processedData[0]?.length ?? 0}
        </div>
      </div>

      {/* Heatmap Container */}
      <div
        ref={containerRef}
        className="bg-gradient-to-br from-purple-50/60 to-indigo-50/60 backdrop-blur-sm rounded-2xl p-4 relative border border-purple-200/40 shadow-sm"
      >
        <svg
          ref={svgRef}
          width={dimensions.width}
          height={dimensions.height}
          className="w-full h-auto"
        />

        {/* Hover tooltip */}
        {hoveredCell && (
          <div className="absolute top-2 left-2 bg-white/90 backdrop-blur-sm text-purple-800 p-3 rounded-xl text-xs z-10 border border-purple-200/50 shadow-lg">
            <div>Position: ({hoveredCell.x}, {hoveredCell.y})</div>
            <div>Value: {hoveredCell.value.toFixed(4)}</div>
          </div>
        )}
      </div>

      {/* Statistics */}
      <div className="mt-4 grid grid-cols-3 gap-3 text-xs">
        <div className="text-center bg-purple-100/60 backdrop-blur-sm rounded-xl p-3 border border-purple-200/40">
          <div className="font-crimson text-purple-600">Min</div>
          <div className="font-playfair font-medium text-purple-800">{stats.min.toFixed(3)}</div>
        </div>
        <div className="text-center bg-indigo-100/60 backdrop-blur-sm rounded-xl p-3 border border-indigo-200/40">
          <div className="font-crimson text-indigo-600">Mean</div>
          <div className="font-playfair font-medium text-indigo-800">{stats.mean.toFixed(3)}</div>
        </div>
        <div className="text-center bg-blue-100/60 backdrop-blur-sm rounded-xl p-3 border border-blue-200/40">
          <div className="font-crimson text-blue-600">Max</div>
          <div className="font-playfair font-medium text-blue-800">{stats.max.toFixed(3)}</div>
        </div>
      </div>
    </motion.div>
  );
}

