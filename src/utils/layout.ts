import dagre from 'dagre';
import { Node, Edge } from '../types';

export function applyAutoLayout(nodes: Node[], edges: Edge[]): Node[] {
  const g = new dagre.graphlib.Graph();
  g.setGraph({
    rankdir: 'TB', // Top to bottom
    nodesep: 80,
    ranksep: 120,
    marginx: 20,
    marginy: 20,
  });
  g.setDefaultEdgeLabel(() => ({}));

  // Add nodes to the graph
  nodes.forEach(node => {
    g.setNode(node.id, { 
      width: 160, 
      height: 80,
      label: node.label 
    });
  });

  // Add edges to the graph
  edges.forEach(edge => {
    g.setEdge(edge.source, edge.target);
  });

  // Run the layout algorithm
  dagre.layout(g);

  // Update node positions
  const layoutedNodes = nodes.map(node => {
    const nodeWithPosition = g.node(node.id);
    return {
      ...node,
      position: {
        x: nodeWithPosition.x - 80, // Center the node
        y: nodeWithPosition.y - 40
      }
    };
  });

  return layoutedNodes;
}