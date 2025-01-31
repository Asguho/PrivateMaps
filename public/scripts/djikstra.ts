import { Algo, DjikstraNode } from './algo.ts';
import { Graph } from './graph.ts';
import { MinHeap } from './minHeap.ts';
import { Point } from './point.ts';

export class Djikstra extends Algo {
  openList: MinHeap<DjikstraNode>;
  constructor(graph: Graph, start: Point, end: Point) {
    super(graph, start, end);
    this.openList = new MinHeap<DjikstraNode>((a, b) => a.g - b.g);
    this.graph.edges.forEach(({ point1, point2, isCarAllowed, maxSpeed }) => {
      if (!this.distances.has(point1.id)) this.distances.set(point1.id, new Map());
      if (!this.distances.has(point2.id)) this.distances.set(point2.id, new Map());
      const calculatedDistance = this.distance(point1, point2);
      const travelTime = isCarAllowed && maxSpeed > 0 ? calculatedDistance / (maxSpeed / 3.6) : Infinity;
      this.distances.get(point1.id)?.set(point2.id, travelTime);
      this.distances.get(point2.id)?.set(point1.id, travelTime);
    });
    
  }

  addOpen(node: DjikstraNode) {
    this.openList.insert(node);
    this.openSet.set(node.id, node); // Track node in Map for quick lookup
  }

  addClosed(state: Point) {
    this.closedList.add(state);
  }

  isInClosed(state: Point) {
    return this.closedList.has(state);
  }

  isInOpen(state: Point) {
    return this.openSet.has(state.id);
  }

  run() {
    const startNode = new DjikstraNode(this.start, null, 0);
    this.addOpen(startNode);
  
    while (!this.openList.isEmpty()) {
      const currentNode = this.openList.pop();
      if (!currentNode) {
        return null; // If no node is returned, break out of the loop
      }
  
      // If we reach the destination, reconstruct the path
      if (currentNode.equals(this.end)) {
        this.currentPath = this.reconstructPath(currentNode);
        return this.currentPath; // Return the path as an array of points
      }
  
      // Mark current node as visited
      this.addClosed(currentNode);
  
      const neighbors = this.getNeighbors(currentNode);
      for (const neighbor of neighbors) {
        if (this.isInClosed(neighbor)) continue;
  
        const g = (currentNode as DjikstraNode).g + this.getDistance(currentNode, neighbor);
        const neighborNode = new DjikstraNode(neighbor, currentNode, g);
  
        // If the neighbor is already in the open list, check if the new g is better
        if (this.isInOpen(neighborNode)) {
          const existingNode = this.openSet.get(neighborNode.id) as DjikstraNode;
          if (existingNode && g < existingNode.g) {
            // Update the g value and parent
            existingNode.g = g;
            existingNode.parent = currentNode;

            this.openList.heap = this.openList.heap.filter(node => node !== existingNode);
  
            // Remove the old node and insert the updated one
            this.openList.insert(existingNode); // Re-insert the updated node
          }
        } else {
          // If the neighbor isn't in the open list, add it
          this.addOpen(neighborNode);
        }
      }
    }
  
    return null; // If no path found
  }
  
  getDistance(point1: Point, point2: Point) {
    return this.distances.get(point1.id)?.get(point2.id) ?? Infinity;
  }
}
