import { Node, Edge, ValidationResult } from '../types';

export function validateDAG(nodes: Node[], edges: Edge[]): ValidationResult {
  const errors: string[] = [];

  // Check minimum nodes
  if (nodes.length < 2) {
    errors.push('Pipeline must have at least 2 nodes');
  }

  // Check if all nodes are connected
  const connectedNodes = new Set<string>();
  edges.forEach(edge => {
    connectedNodes.add(edge.source);
    connectedNodes.add(edge.target);
  });

  const disconnectedNodes = nodes.filter(node => !connectedNodes.has(node.id));
  if (disconnectedNodes.length > 0) {
    errors.push(`${disconnectedNodes.length} node(s) are not connected`);
  }

  // Check for cycles using DFS
  if (hasCycle(nodes, edges)) {
    errors.push('Pipeline contains cycles (not a valid DAG)');
  }

  // Check for self-loops
  const selfLoops = edges.filter(edge => edge.source === edge.target);
  if (selfLoops.length > 0) {
    errors.push('Self-connections are not allowed');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

function hasCycle(nodes: Node[], edges: Edge[]): boolean {
  const adjacencyList = new Map<string, string[]>();
  
  // Build adjacency list
  nodes.forEach(node => {
    adjacencyList.set(node.id, []);
  });
  
  edges.forEach(edge => {
    const neighbors = adjacencyList.get(edge.source) || [];
    neighbors.push(edge.target);
    adjacencyList.set(edge.source, neighbors);
  });

  const visited = new Set<string>();
  const recursionStack = new Set<string>();

  function dfs(nodeId: string): boolean {
    if (recursionStack.has(nodeId)) {
      return true; // Cycle detected
    }
    
    if (visited.has(nodeId)) {
      return false;
    }

    visited.add(nodeId);
    recursionStack.add(nodeId);

    const neighbors = adjacencyList.get(nodeId) || [];
    for (const neighbor of neighbors) {
      if (dfs(neighbor)) {
        return true;
      }
    }

    recursionStack.delete(nodeId);
    return false;
  }

  for (const node of nodes) {
    if (!visited.has(node.id)) {
      if (dfs(node.id)) {
        return true;
      }
    }
  }

  return false;
}