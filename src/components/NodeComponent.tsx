import React, { useState, useRef, useCallback } from 'react';
import { Node } from '../types';
import { Grip, X, Circle } from 'lucide-react';

interface NodeComponentProps {
  node: Node;
  onNodeUpdate: (nodeId: string, updates: Partial<Node>) => void;
  onNodeDelete: (nodeId: string) => void;
  onConnectionStart: (nodeId: string, type: 'input' | 'output', position: { x: number; y: number }) => void;
  onConnectionEnd: (nodeId: string, type: 'input' | 'output') => void;
  isConnecting: boolean;
  connectionStart?: { nodeId: string; type: 'input' | 'output' } | null;
}

export const NodeComponent: React.FC<NodeComponentProps> = ({
  node,
  onNodeUpdate,
  onNodeDelete,
  onConnectionStart,
  onConnectionEnd,
  isConnecting,
  connectionStart,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [isHovered, setIsHovered] = useState(false);
  const [dragStartPos, setDragStartPos] = useState({ x: 0, y: 0 });
  const nodeRef = useRef<HTMLDivElement>(null);
  const dragThreshold = 5; // Minimum pixels to move before starting drag

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    // Don't start dragging if clicking on connection points or delete button
    const target = e.target as HTMLElement;
    if (target.closest('.connection-point') || target.closest('.delete-button')) {
      return;
    }
    
    const rect = nodeRef.current?.getBoundingClientRect();
    if (rect) {
      const startPos = {
        x: e.clientX,
        y: e.clientY
      };
      
      setDragStartPos(startPos);
      setDragOffset({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top
      });
    }
    
    onNodeUpdate(node.id, { selected: true });
    e.preventDefault();
  }, [node.id, onNodeUpdate]);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!dragStartPos.x && !dragStartPos.y) return;
    
    // Check if we've moved enough to start dragging
    const distance = Math.sqrt(
      Math.pow(e.clientX - dragStartPos.x, 2) + 
      Math.pow(e.clientY - dragStartPos.y, 2)
    );
    
    if (!isDragging && distance > dragThreshold) {
      setIsDragging(true);
      document.body.style.cursor = 'grabbing';
      document.body.style.userSelect = 'none';
    }
    
    if (!isDragging) return;
    
    const container = nodeRef.current?.parentElement;
    if (!container) return;
    
    const containerRect = container.getBoundingClientRect();
    const newX = e.clientX - containerRect.left - dragOffset.x;
    const newY = e.clientY - containerRect.top - dragOffset.y;
    
    // Constrain to container bounds with padding
    const padding = 20;
    const maxX = container.clientWidth - 200 - padding; // 200 is node width
    const maxY = container.clientHeight - 120 - padding; // 120 is node height
    
    const constrainedX = Math.max(padding, Math.min(maxX, newX));
    const constrainedY = Math.max(padding, Math.min(maxY, newY));
    
    onNodeUpdate(node.id, {
      position: { x: constrainedX, y: constrainedY }
    });
  }, [isDragging, dragOffset, dragStartPos, node.id, onNodeUpdate, dragThreshold]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
    setDragStartPos({ x: 0, y: 0 });
    document.body.style.cursor = '';
    document.body.style.userSelect = '';
    
    // Only deselect if we actually dragged
    if (isDragging) {
      setTimeout(() => {
        onNodeUpdate(node.id, { selected: false });
      }, 100);
    }
  }, [isDragging, node.id, onNodeUpdate]);

  React.useEffect(() => {
    if (dragStartPos.x || dragStartPos.y) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [handleMouseMove, handleMouseUp, dragStartPos]);

  const handleConnectionPointMouseDown = useCallback((type: 'input' | 'output', e: React.MouseEvent) => {
    e.stopPropagation();
    
    if (type === 'input' && !isConnecting) {
      return; // Can only start connections from output points
    }
    
    const rect = (e.target as HTMLElement).getBoundingClientRect();
    const containerRect = nodeRef.current?.parentElement?.getBoundingClientRect();
    
    if (containerRect) {
      const position = {
        x: rect.left + rect.width / 2 - containerRect.left,
        y: rect.top + rect.height / 2 - containerRect.top
      };
      
      if (isConnecting) {
        onConnectionEnd(node.id, type);
      } else {
        onConnectionStart(node.id, type, position);
      }
    }
  }, [isConnecting, onConnectionStart, onConnectionEnd, node.id]);

  const canConnect = useCallback((type: 'input' | 'output') => {
    if (!isConnecting || !connectionStart) return false;
    
    // Can't connect to same node
    if (connectionStart.nodeId === node.id) return false;
    
    // Can only connect output to input
    if (connectionStart.type === 'output' && type === 'input') return true;
    
    return false;
  }, [isConnecting, connectionStart, node.id]);

  const getConnectionPointStyle = useCallback((type: 'input' | 'output') => {
    const baseClasses = "absolute w-5 h-5 rounded-full border-2 border-white transition-all duration-200 connection-point shadow-lg";
    
    if (isConnecting && canConnect(type)) {
      return `${baseClasses} bg-yellow-400 hover:bg-yellow-500 cursor-pointer scale-125 animate-pulse shadow-yellow-300`;
    }
    
    if (type === 'input') {
      return `${baseClasses} bg-emerald-500 hover:bg-emerald-600 cursor-pointer hover:scale-110 shadow-emerald-200 ${isConnecting ? 'opacity-50' : ''}`;
    } else {
      return `${baseClasses} bg-blue-500 hover:bg-blue-600 cursor-pointer hover:scale-110 shadow-blue-200 ${isConnecting && connectionStart?.nodeId === node.id ? 'bg-blue-600 scale-110 animate-pulse' : ''}`;
    }
  }, [isConnecting, canConnect, connectionStart]);

  const handleDeleteClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm(`Are you sure you want to delete "${node.label}"?`)) {
      onNodeDelete(node.id);
    }
  }, [node.id, node.label, onNodeDelete]);

  return (
    <div
      ref={nodeRef}
      className={`absolute bg-white rounded-xl shadow-lg border-2 transition-all duration-200 select-none ${
        node.selected 
          ? 'border-blue-500 shadow-blue-200 shadow-xl scale-105' 
          : isHovered
          ? 'border-gray-400 shadow-xl scale-102'
          : 'border-gray-300 hover:border-gray-400'
      } ${isDragging ? 'cursor-grabbing scale-105 shadow-2xl' : 'cursor-grab'}`}
      style={{
        left: node.position.x,
        top: node.position.y,
        width: 200,
        height: 120,
        zIndex: node.selected || isDragging ? 30 : isHovered ? 20 : 10,
        transform: isDragging ? 'rotate(2deg)' : 'rotate(0deg)'
      }}
      onMouseDown={handleMouseDown}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Input Connection Point */}
      <div
        className={`${getConnectionPointStyle('input')} left-0 top-1/2 transform -translate-y-1/2 -translate-x-1/2`}
        onMouseDown={(e) => handleConnectionPointMouseDown('input', e)}
        title={isConnecting && canConnect('input') ? "Click to complete connection" : "Input connection point"}
      >
        {isConnecting && canConnect('input') && (
          <Circle className="w-7 h-7 text-yellow-500 absolute -top-1 -left-1 animate-ping" />
        )}
      </div>
      
      {/* Output Connection Point */}
      <div
        className={`${getConnectionPointStyle('output')} right-0 top-1/2 transform -translate-y-1/2 translate-x-1/2`}
        onMouseDown={(e) => handleConnectionPointMouseDown('output', e)}
        title={isConnecting ? "Connection in progress..." : "Click to start connection"}
      >
        {isConnecting && connectionStart?.nodeId === node.id && (
          <Circle className="w-7 h-7 text-blue-500 absolute -top-1 -left-1 animate-ping" />
        )}
      </div>

      {/* Node Header */}
      <div className="flex items-center justify-between p-4 bg-gradient-to-r from-gray-50 to-gray-100 rounded-t-xl border-b border-gray-200">
        <div className="flex items-center gap-3">
          <Grip className="w-5 h-5 text-gray-400" />
          <span className="text-sm font-semibold text-gray-700">Pipeline Node</span>
        </div>
        <button
          onClick={handleDeleteClick}
          className="delete-button text-red-400 hover:text-red-600 hover:bg-red-50 p-2 rounded-lg transition-all duration-200 hover:scale-110"
          title="Delete node"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Node Content */}
      <div className="p-4 flex-1 flex items-center justify-center">
        <div className="text-center">
          <div className="text-lg font-bold text-gray-800 truncate max-w-36" title={node.label}>
            {node.label}
          </div>
          <div className="text-xs text-gray-500 mt-2 font-mono">
            ID: {node.id.slice(0, 8)}...
          </div>
        </div>
      </div>

      {/* Connection Instructions (when connecting) */}
      {isConnecting && connectionStart?.nodeId === node.id && (
        <div className="absolute -bottom-10 left-1/2 transform -translate-x-1/2 bg-blue-600 text-white text-xs px-3 py-2 rounded-lg whitespace-nowrap shadow-lg animate-bounce">
          Click on a green input point to connect
        </div>
      )}

      {/* Drag indicator */}
      {isDragging && (
        <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white text-xs px-2 py-1 rounded shadow-lg">
          Dragging...
        </div>
      )}
    </div>
  );
};