import React from 'react';
import { Edge } from '../types';
import { getEdgePath } from '../utils/geometry';
import { Trash2 } from 'lucide-react';

interface EdgeComponentProps {
  edge: Edge;
  sourcePosition: { x: number; y: number };
  targetPosition: { x: number; y: number };
  onEdgeClick: (edgeId: string) => void;
  onEdgeDelete: (edgeId: string) => void;
  isValid: boolean;
}

export const EdgeComponent: React.FC<EdgeComponentProps> = ({
  edge,
  sourcePosition,
  targetPosition,
  onEdgeClick,
  onEdgeDelete,
  isValid,
}) => {
  const path = getEdgePath(sourcePosition, targetPosition);
  
  // Calculate midpoint for arrow positioning
  const midX = (sourcePosition.x + targetPosition.x) / 2;
  const midY = (sourcePosition.y + targetPosition.y) / 2;
  
  // Calculate arrow rotation based on edge direction
  const dx = targetPosition.x - sourcePosition.x;
  const dy = targetPosition.y - sourcePosition.y;
  const angle = Math.atan2(dy, dx) * 180 / Math.PI;

  const getEdgeColor = () => {
    if (!isValid) return '#EF4444';
    if (edge.selected) return '#3B82F6';
    return '#6B7280';
  };

  const getEdgeWidth = () => {
    if (edge.selected) return 3;
    return 2;
  };

  const getArrowSize = () => {
    if (edge.selected) return 18;
    return 16;
  };

  const handleDeleteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm('Are you sure you want to delete this connection?')) {
      onEdgeDelete(edge.id);
    }
  };

  return (
    <g>
      {/* Main Edge Path */}
      <path
        d={path}
        stroke={getEdgeColor()}
        strokeWidth={getEdgeWidth()}
        fill="none"
        className="transition-all duration-200 cursor-pointer hover:stroke-blue-500"
        onClick={() => onEdgeClick(edge.id)}
        strokeDasharray={!isValid ? '8,4' : 'none'}
        style={{ 
          filter: edge.selected 
            ? 'drop-shadow(0 0 8px rgba(59, 130, 246, 0.6))' 
            : isValid 
            ? 'drop-shadow(0 2px 4px rgba(0, 0, 0, 0.1))' 
            : 'drop-shadow(0 0 6px rgba(239, 68, 68, 0.4))'
        }}
      />
      
      {/* Invisible thicker path for easier clicking */}
      <path
        d={path}
        stroke="transparent"
        strokeWidth={24}
        fill="none"
        className="cursor-pointer"
        onClick={() => onEdgeClick(edge.id)}
      />
      
      {/* Large, Prominent Arrow at Center */}
      <g transform={`translate(${midX}, ${midY}) rotate(${angle})`}>
        {/* Arrow Shadow for better visibility */}
        <polygon
          points={`-${getArrowSize() + 2},-${(getArrowSize() + 2) * 0.6} -${getArrowSize() + 2},${(getArrowSize() + 2) * 0.6} ${getArrowSize() + 2},0`}
          fill="rgba(0, 0, 0, 0.2)"
          className="cursor-pointer transition-all duration-200"
          onClick={() => onEdgeClick(edge.id)}
          transform="translate(1, 1)"
        />
        
        {/* Main Arrow */}
        <polygon
          points={`-${getArrowSize()},-${getArrowSize() * 0.6} -${getArrowSize()},${getArrowSize() * 0.6} ${getArrowSize()},0`}
          fill={getEdgeColor()}
          stroke="white"
          strokeWidth={edge.selected ? "2" : "1"}
          className="cursor-pointer transition-all duration-200 hover:fill-blue-500"
          onClick={() => onEdgeClick(edge.id)}
          style={{ 
            filter: edge.selected 
              ? 'drop-shadow(0 0 6px rgba(59, 130, 246, 0.8))' 
              : 'drop-shadow(0 1px 3px rgba(0, 0, 0, 0.2))'
          }}
        />
        
        {/* Arrow Highlight Ring (when selected) */}
        {edge.selected && (
          <circle
            cx="0"
            cy="0"
            r={getArrowSize() + 6}
            fill="none"
            stroke="#3B82F6"
            strokeWidth="2"
            strokeDasharray="6,6"
            className="animate-spin"
            style={{ animationDuration: '3s' }}
          />
        )}
      </g>

      {/* Delete Button (always visible on hover, prominent when selected) */}
      <g 
        className={`transition-opacity duration-200 ${
          edge.selected ? 'opacity-100' : 'opacity-0 hover:opacity-100'
        }`}
      >
        {/* Delete button background circle */}
        <circle
          cx={midX + 35}
          cy={midY - 35}
          r="18"
          fill="white"
          stroke="#EF4444"
          strokeWidth="2"
          className="cursor-pointer hover:fill-red-50 hover:stroke-red-600 transition-all duration-200 drop-shadow-lg"
          onClick={handleDeleteClick}
        />
        
        {/* Delete icon */}
        <foreignObject
          x={midX + 35 - 8}
          y={midY - 35 - 8}
          width="16"
          height="16"
          className="pointer-events-none"
        >
          <Trash2 className="w-4 h-4 text-red-500" />
        </foreignObject>
        
        {/* Delete button tooltip */}
        <g className="opacity-0 hover:opacity-100 transition-opacity duration-200">
          <rect
            x={midX + 50}
            y={midY - 45}
            width="60"
            height="20"
            fill="rgba(0, 0, 0, 0.8)"
            rx="4"
          />
          <text
            x={midX + 80}
            y={midY - 32}
            textAnchor="middle"
            className="text-xs fill-white font-medium pointer-events-none"
          >
            Delete
          </text>
        </g>
      </g>

      {/* Edge Status Label (for invalid edges) */}
      {!isValid && (
        <g>
          <rect
            x={midX - 35}
            y={midY + 25}
            width="70"
            height="26"
            fill="#FEF2F2"
            stroke="#EF4444"
            strokeWidth="2"
            rx="8"
            className="opacity-95 drop-shadow-md"
          />
          <text
            x={midX}
            y={midY + 42}
            textAnchor="middle"
            className="text-sm fill-red-700 font-semibold pointer-events-none"
          >
            Invalid
          </text>
        </g>
      )}

      {/* Edge Selection Indicator */}
      {edge.selected && (
        <g>
          <rect
            x={midX - 45}
            y={midY - 55}
            width="90"
            height="22"
            fill="rgba(59, 130, 246, 0.9)"
            rx="6"
            className="opacity-90 drop-shadow-md"
          />
          <text
            x={midX}
            y={midY - 41}
            textAnchor="middle"
            className="text-xs fill-white font-medium pointer-events-none"
          >
            Selected Connection
          </text>
        </g>
      )}
    </g>
  );
};