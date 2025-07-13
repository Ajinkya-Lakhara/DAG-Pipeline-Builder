export function getDistance(point1: { x: number; y: number }, point2: { x: number; y: number }): number {
  const dx = point2.x - point1.x;
  const dy = point2.y - point1.y;
  return Math.sqrt(dx * dx + dy * dy);
}

export function getEdgePath(source: { x: number; y: number }, target: { x: number; y: number }): string {
  const dx = target.x - source.x;
  const dy = target.y - source.y;
  
  // Create a smooth curved path for better visual appeal
  const distance = Math.sqrt(dx * dx + dy * dy);
  
  // Calculate control points for a smooth curve
  const midX = source.x + dx / 2;
  const midY = source.y + dy / 2;
  
  // Add curve based on distance and direction
  const curveIntensity = Math.min(distance * 0.3, 80);
  
  // Determine curve direction based on relative positions
  let controlX1, controlY1, controlX2, controlY2;
  
  if (Math.abs(dx) > Math.abs(dy)) {
    // Horizontal-dominant curve
    controlX1 = source.x + dx * 0.3;
    controlY1 = source.y;
    controlX2 = target.x - dx * 0.3;
    controlY2 = target.y;
  } else {
    // Vertical-dominant curve
    controlX1 = source.x;
    controlY1 = source.y + dy * 0.3;
    controlX2 = target.x;
    controlY2 = target.y - dy * 0.3;
  }
  
  // Create a smooth cubic bezier curve
  return `M ${source.x} ${source.y} C ${controlX1} ${controlY1}, ${controlX2} ${controlY2}, ${target.x} ${target.y}`;
}

export function getConnectionPoint(
  nodePosition: { x: number; y: number },
  type: 'input' | 'output',
  nodeWidth: number = 180,
  nodeHeight: number = 100
): { x: number; y: number } {
  const centerY = nodePosition.y + nodeHeight / 2;
  
  if (type === 'input') {
    return { x: nodePosition.x, y: centerY };
  } else {
    return { x: nodePosition.x + nodeWidth, y: centerY };
  }
}