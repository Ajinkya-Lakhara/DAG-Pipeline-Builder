import React, { useState, useCallback, useEffect, useRef } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { Node, Edge, ConnectionPoint, PipelineData } from '../types';
import { NodeComponent } from './NodeComponent';
import { EdgeComponent } from './EdgeComponent';
import { StatusPanel } from './StatusPanel';
import { JsonPreview } from './JsonPreview';
import { validateDAG } from '../utils/dagValidation';
import { applyAutoLayout } from '../utils/layout';
import { getConnectionPoint } from '../utils/geometry';
import { Plus, LayoutGrid, Trash2, Download, RefreshCw } from 'lucide-react';

export const PipelineEditor: React.FC = () => {
  const [nodes, setNodes] = useState<Node[]>([]);
  const [edges, setEdges] = useState<Edge[]>([]);
  const [selectedItems, setSelectedItems] = useState<{ nodeIds: string[]; edgeIds: string[] }>({
    nodeIds: [],
    edgeIds: []
  });
  const [isConnecting, setIsConnecting] = useState(false);
  const [connectionStart, setConnectionStart] = useState<ConnectionPoint | null>(null);
  const [tempEdge, setTempEdge] = useState<{ from: { x: number; y: number }; to: { x: number; y: number } } | null>(null);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [showInstructions, setShowInstructions] = useState(true);
  
  const canvasRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  const validation = validateDAG(nodes, edges);

  const handleAddNode = useCallback(() => {
    const name = prompt('Enter node name:', `Node ${nodes.length + 1}`);
    if (!name || !name.trim()) return;

    const newNode: Node = {
      id: uuidv4(),
      label: name.trim(),
      position: { 
        x: 150 + (nodes.length % 4) * 220, 
        y: 150 + Math.floor(nodes.length / 4) * 160 
      },
      selected: false,
    };

    setNodes(prev => [...prev, newNode]);
    
    // Hide instructions after first node
    if (nodes.length === 0) {
      setShowInstructions(false);
    }
  }, [nodes.length]);

  const handleNodeUpdate = useCallback((nodeId: string, updates: Partial<Node>) => {
    setNodes(prev => prev.map(node => 
      node.id === nodeId ? { ...node, ...updates } : node
    ));
  }, []);

  const handleNodeDelete = useCallback((nodeId: string) => {
    setNodes(prev => prev.filter(node => node.id !== nodeId));
    setEdges(prev => prev.filter(edge => edge.source !== nodeId && edge.target !== nodeId));
  }, []);

  const handleConnectionStart = useCallback((nodeId: string, type: 'input' | 'output', position: { x: number; y: number }) => {
    if (type === 'input') return; // Can only start connections from output points
    
    setIsConnecting(true);
    setConnectionStart({ nodeId, type, position });
    setTempEdge({ from: position, to: position });
  }, []);

  const handleConnectionEnd = useCallback((nodeId: string, type: 'input' | 'output') => {
    if (!connectionStart || !isConnecting) return;
    
    // Validate connection rules
    if (connectionStart.nodeId === nodeId) {
      alert('❌ Self-connections are not allowed!');
      setIsConnecting(false);
      setConnectionStart(null);
      setTempEdge(null);
      return;
    }

    if (connectionStart.type === type) {
      alert('❌ Cannot connect output to output or input to input!');
      setIsConnecting(false);
      setConnectionStart(null);
      setTempEdge(null);
      return;
    }

    if (type !== 'input') {
      alert('❌ Connections must end at input points (green circles)!');
      setIsConnecting(false);
      setConnectionStart(null);
      setTempEdge(null);
      return;
    }

    // Check if edge already exists
    const existingEdge = edges.find(edge => 
      edge.source === connectionStart.nodeId && edge.target === nodeId
    );
    
    if (existingEdge) {
      alert('❌ Connection already exists between these nodes!');
      setIsConnecting(false);
      setConnectionStart(null);
      setTempEdge(null);
      return;
    }

    const newEdge: Edge = {
      id: uuidv4(),
      source: connectionStart.nodeId,
      target: nodeId,
      selected: false,
    };

    setEdges(prev => [...prev, newEdge]);
    setIsConnecting(false);
    setConnectionStart(null);
    setTempEdge(null);
    
    // Show success feedback
    const sourceNode = nodes.find(n => n.id === connectionStart.nodeId);
    const targetNode = nodes.find(n => n.id === nodeId);
    if (sourceNode && targetNode) {
      // Could add a toast notification here
      console.log(`✅ Connected "${sourceNode.label}" to "${targetNode.label}"`);
    }
  }, [connectionStart, isConnecting, edges, nodes]);

  const handleEdgeClick = useCallback((edgeId: string) => {
    setEdges(prev => prev.map(edge => 
      edge.id === edgeId ? { ...edge, selected: !edge.selected } : { ...edge, selected: false }
    ));
    setSelectedItems(prev => ({
      ...prev,
      edgeIds: prev.edgeIds.includes(edgeId) ? [] : [edgeId]
    }));
  }, []);

  const handleEdgeDelete = useCallback((edgeId: string) => {
    setEdges(prev => prev.filter(edge => edge.id !== edgeId));
    setSelectedItems(prev => ({
      ...prev,
      edgeIds: prev.edgeIds.filter(id => id !== edgeId)
    }));
  }, []);

  const handleCanvasClick = useCallback((e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      // Clear all selections
      setNodes(prev => prev.map(node => ({ ...node, selected: false })));
      setEdges(prev => prev.map(edge => ({ ...edge, selected: false })));
      setSelectedItems({ nodeIds: [], edgeIds: [] });
      
      // Cancel connection if in progress
      if (isConnecting) {
        setIsConnecting(false);
        setConnectionStart(null);
        setTempEdge(null);
      }
    }
  }, [isConnecting]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    
    const newMousePosition = {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    };
    
    setMousePosition(newMousePosition);
    
    if (isConnecting && tempEdge) {
      setTempEdge(prev => prev ? { ...prev, to: newMousePosition } : null);
    }
  }, [isConnecting, tempEdge]);

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Delete' || e.key === 'Backspace') {
      // Delete selected items
      const selectedNodeIds = nodes.filter(node => node.selected).map(node => node.id);
      const selectedEdgeIds = edges.filter(edge => edge.selected).map(edge => edge.id);
      
      if (selectedNodeIds.length > 0) {
        if (window.confirm(`Delete ${selectedNodeIds.length} selected node(s)?`)) {
          setNodes(prev => prev.filter(node => !selectedNodeIds.includes(node.id)));
          setEdges(prev => prev.filter(edge => 
            !selectedNodeIds.includes(edge.source) && !selectedNodeIds.includes(edge.target)
          ));
        }
      }
      
      if (selectedEdgeIds.length > 0) {
        if (window.confirm(`Delete ${selectedEdgeIds.length} selected connection(s)?`)) {
          setEdges(prev => prev.filter(edge => !selectedEdgeIds.includes(edge.id)));
        }
      }
      
      setSelectedItems({ nodeIds: [], edgeIds: [] });
    }

    if (e.key === 'Escape' && isConnecting) {
      setIsConnecting(false);
      setConnectionStart(null);
      setTempEdge(null);
    }
  }, [nodes, edges, isConnecting]);

  const handleAutoLayout = useCallback(() => {
    if (nodes.length === 0) return;
    
    const layoutedNodes = applyAutoLayout(nodes, edges);
    setNodes(layoutedNodes);
    
    // Clear selections
    setNodes(prev => prev.map(node => ({ ...node, selected: false })));
    setEdges(prev => prev.map(edge => ({ ...edge, selected: false })));
    setSelectedItems({ nodeIds: [], edgeIds: [] });
  }, [nodes, edges]);

  const handleExport = useCallback(() => {
    const data: PipelineData = { nodes, edges };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `pipeline-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }, [nodes, edges]);

  const handleClearAll = useCallback(() => {
    if (window.confirm('Are you sure you want to clear the entire pipeline? This action cannot be undone.')) {
      setNodes([]);
      setEdges([]);
      setSelectedItems({ nodeIds: [], edgeIds: [] });
      setShowInstructions(true);
    }
  }, []);

  const createSamplePipeline = useCallback(() => {
    const sampleNodes: Node[] = [
      { id: '1', label: 'Data Source', position: { x: 100, y: 200 }, selected: false },
      { id: '2', label: 'Transform', position: { x: 400, y: 150 }, selected: false },
      { id: '3', label: 'Filter', position: { x: 400, y: 250 }, selected: false },
      { id: '4', label: 'Aggregate', position: { x: 700, y: 200 }, selected: false },
      { id: '5', label: 'Output', position: { x: 1000, y: 200 }, selected: false },
    ];

    const sampleEdges: Edge[] = [
      { id: 'e1', source: '1', target: '2', selected: false },
      { id: 'e2', source: '1', target: '3', selected: false },
      { id: 'e3', source: '2', target: '4', selected: false },
      { id: 'e4', source: '3', target: '4', selected: false },
      { id: 'e5', source: '4', target: '5', selected: false },
    ];

    setNodes(sampleNodes);
    setEdges(sampleEdges);
    setShowInstructions(false);
  }, []);

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleKeyDown]);

  const pipelineData: PipelineData = { nodes, edges };

  return (
    <div className="h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex flex-col">
      {/* Header */}
      <div className="bg-white shadow-xl border-b border-gray-200">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-3">
                <img 
                  src="/employee_connection-removebg-preview.png" 
                  alt="Pipeline Editor Logo" 
                  className="w-12 h-12 object-contain"
                />
                <div>
                  <h1 className="text-2xl font-bold text-gray-800">Pipeline Editor</h1>
                  <p className="text-sm text-gray-600">Build and manage your data processing workflows</p>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={handleAddNode}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all duration-200 shadow-md hover:shadow-lg hover:scale-105"
              >
                <Plus className="w-4 h-4" />
                Add Node
              </button>
              <button
                onClick={handleAutoLayout}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-all duration-200 shadow-md hover:shadow-lg hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                disabled={nodes.length === 0}
              >
                <LayoutGrid className="w-4 h-4" />
                Auto Layout
              </button>
              <button
                onClick={createSamplePipeline}
                className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-all duration-200 shadow-md hover:shadow-lg hover:scale-105"
              >
                <RefreshCw className="w-4 h-4" />
                Sample
              </button>
              <button
                onClick={handleExport}
                className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-all duration-200 shadow-md hover:shadow-lg hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                disabled={nodes.length === 0}
              >
                <Download className="w-4 h-4" />
                Export
              </button>
              <button
                onClick={handleClearAll}
                className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-all duration-200 shadow-md hover:shadow-lg hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                disabled={nodes.length === 0}
              >
                <Trash2 className="w-4 h-4" />
                Clear All
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Canvas */}
        <div className="flex-1 relative">
          <div
            ref={canvasRef}
            className={`w-full h-full relative overflow-hidden ${isConnecting ? 'cursor-crosshair' : 'cursor-default'}`}
            onClick={handleCanvasClick}
            onMouseMove={handleMouseMove}
          >
            {/* Enhanced Grid Background */}
            <div className="absolute inset-0 opacity-40">
              <svg width="100%" height="100%">
                <defs>
                  <pattern id="grid" width="30" height="30" patternUnits="userSpaceOnUse">
                    <path d="M 30 0 L 0 0 0 30" fill="none" stroke="#e2e8f0" strokeWidth="1"/>
                  </pattern>
                  <pattern id="smallGrid" width="10" height="10" patternUnits="userSpaceOnUse">
                    <path d="M 10 0 L 0 0 0 10" fill="none" stroke="#f1f5f9" strokeWidth="0.5"/>
                  </pattern>
                </defs>
                <rect width="100%" height="100%" fill="url(#smallGrid)" />
                <rect width="100%" height="100%" fill="url(#grid)" />
              </svg>
            </div>

            {/* Welcome Message */}
            {showInstructions && nodes.length === 0 && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-lg text-center border border-gray-200">
                  <div className="p-4 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-full w-24 h-24 mx-auto mb-6 flex items-center justify-center">
                    <img 
                      src="/employee_connection-removebg-preview.png" 
                      alt="Logo" 
                      className="w-16 h-16 object-contain"
                    />
                  </div>
                  <h2 className="text-3xl font-bold text-gray-800 mb-4">Welcome to Pipeline Editor</h2>
                  <p className="text-gray-600 mb-8 text-lg">Start building your data processing workflow by adding your first node or loading a sample pipeline.</p>
                  <div className="space-y-3">
                    <button
                      onClick={handleAddNode}
                      className="w-full flex items-center justify-center gap-3 px-6 py-4 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all duration-200 hover:scale-105 shadow-lg"
                    >
                      <Plus className="w-5 h-5" />
                      Create First Node
                    </button>
                    <button
                      onClick={createSamplePipeline}
                      className="w-full flex items-center justify-center gap-3 px-6 py-4 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-all duration-200 hover:scale-105"
                    >
                      <RefreshCw className="w-5 h-5" />
                      Load Sample Pipeline
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Enhanced Connection Instructions */}
            {isConnecting && (
              <div className="absolute top-6 left-1/2 transform -translate-x-1/2 bg-gradient-to-r from-blue-600 to-blue-700 text-white px-6 py-3 rounded-xl shadow-xl z-50 border border-blue-500">
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 bg-white rounded-full animate-pulse"></div>
                  <span className="font-semibold text-lg">Click on a green input point to complete the connection</span>
                  <div className="text-xs bg-blue-800 px-2 py-1 rounded">Press ESC to cancel</div>
                </div>
              </div>
            )}

            {/* Edges */}
            <svg
              ref={svgRef}
              className="absolute inset-0 w-full h-full pointer-events-none"
              style={{ zIndex: 1 }}
            >
              {edges.map(edge => {
                const sourceNode = nodes.find(n => n.id === edge.source);
                const targetNode = nodes.find(n => n.id === edge.target);
                
                if (!sourceNode || !targetNode) return null;
                
                const sourcePos = getConnectionPoint(sourceNode.position, 'output', 200, 120);
                const targetPos = getConnectionPoint(targetNode.position, 'input', 200, 120);
                
                const isValid = edge.source !== edge.target;
                
                return (
                  <EdgeComponent
                    key={edge.id}
                    edge={edge}
                    sourcePosition={sourcePos}
                    targetPosition={targetPos}
                    onEdgeClick={handleEdgeClick}
                    onEdgeDelete={handleEdgeDelete}
                    isValid={isValid}
                  />
                );
              })}
              
              {/* Enhanced Temporary edge while connecting */}
              {tempEdge && (
                <g>
                  <path
                    d={`M ${tempEdge.from.x} ${tempEdge.from.y} L ${tempEdge.to.x} ${tempEdge.to.y}`}
                    stroke="#3B82F6"
                    strokeWidth="4"
                    strokeDasharray="10,5"
                    fill="none"
                    className="animate-pulse"
                    style={{ filter: 'drop-shadow(0 0 8px rgba(59, 130, 246, 0.6))' }}
                  />
                  <circle
                    cx={tempEdge.to.x}
                    cy={tempEdge.to.y}
                    r="6"
                    fill="#3B82F6"
                    className="animate-pulse"
                    style={{ filter: 'drop-shadow(0 0 6px rgba(59, 130, 246, 0.8))' }}
                  />
                </g>
              )}
            </svg>

            {/* Nodes */}
            {nodes.map(node => (
              <NodeComponent
                key={node.id}
                node={node}
                onNodeUpdate={handleNodeUpdate}
                onNodeDelete={handleNodeDelete}
                onConnectionStart={handleConnectionStart}
                onConnectionEnd={handleConnectionEnd}
                isConnecting={isConnecting}
                connectionStart={connectionStart}
              />
            ))}
          </div>
        </div>

        {/* Right Panel */}
        <div className="w-80 bg-white border-l border-gray-200 p-6 space-y-6 overflow-y-auto shadow-xl">
          <StatusPanel
            validation={validation}
            nodeCount={nodes.length}
            edgeCount={edges.length}
          />
          
          <JsonPreview data={pipelineData} />
          
          {/* Enhanced Instructions */}
          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-5 border border-blue-200">
            <h4 className="font-bold text-blue-800 mb-4 flex items-center gap-2 text-lg">
              <img 
                src="/employee_connection-removebg-preview.png" 
                alt="Logo" 
                className="w-5 h-5 object-contain"
              />
              Quick Guide
            </h4>
            <ul className="space-y-3 text-sm text-blue-700">
              <li className="flex items-start gap-3">
                <span className="text-blue-400 mt-1 text-xs">●</span>
                <span><strong>Add nodes:</strong> Click "Add Node" button or use sample</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-blue-400 mt-1 text-xs">●</span>
                <span><strong>Connect:</strong> Click blue output → green input</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-blue-400 mt-1 text-xs">●</span>
                <span><strong>Move:</strong> Drag nodes to reposition them</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-blue-400 mt-1 text-xs">●</span>
                <span><strong>Delete:</strong> Click delete button or use Delete key</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-blue-400 mt-1 text-xs">●</span>
                <span><strong>Cancel:</strong> Press Escape while connecting</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-blue-400 mt-1 text-xs">●</span>
                <span><strong>Auto Layout:</strong> Organize nodes automatically</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};