export interface Node {
  id: string;
  label: string;
  position: { x: number; y: number };
  selected: boolean;
}

export interface Edge {
  id: string;
  source: string;
  target: string;
  selected: boolean;
}

export interface ConnectionPoint {
  nodeId: string;
  type: 'input' | 'output';
  position: { x: number; y: number };
}

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

export interface PipelineData {
  nodes: Node[];
  edges: Edge[];
}