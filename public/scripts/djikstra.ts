import { Algo, DjikstraNode } from './algo.ts';
import { Graph } from './graph.ts';
import { MinHeap } from './minHeap.ts';
import { Point } from './point.ts';

export class Djikstra extends Algo {
  constructor(graph: Graph, start: Point, end: Point) {
    super(graph, start, end);
    this.openList = new MinHeap((a, b) => a.g - b.g); // MinHeap for efficiency
    this.graph.edges.forEach(({ point1, point2, isCarAllowed }) => {
      if (!this.distances.has(point1.id)) this.distances.set(point1.id, new Map());
      if (!this.distances.has(point2.id)) this.distances.set(point2.id, new Map());
      const calculatedDistance = isCarAllowed ? this.distance(point1, point2) : Infinity;
      this.distances.get(point1.id)?.set(point2.id, calculatedDistance);
      this.distances.get(point2.id)?.set(point1.id, calculatedDistance);
    });
  }

  addOpen(node: DjikstraNode) {
    this.openList.insert(node);
    this.openSet.set(new Point(node.id, node.lat, node.lon), node); // Track node in Map for quick lookup
  }

  addClosed(state: Point) {
    this.closedList.add(state);
  }

  isInClosed(state: Point) {
    return this.closedList.has(state);
  }

  isInOpen(state: Point) {
    return this.openSet.has(state);
  }

  run() {
    const startNode = new DjikstraNode(this.start, null, 0);
    this.addOpen(startNode);

    while (!this.openList.isEmpty()) {
      const currentNode = this.openList.pop();

      // If we reach the destination, reconstruct the path
      if (currentNode.point === this.end) {
        this.currentPath = this.reconstructPath(currentNode);
        return this.currentPath; // Return the path as an array of points
      }

      // Mark current node as visited
      this.addClosed(currentNode);

      const neighbors = this.getNeighbors(currentNode.state);
      for (const neighbor of neighbors) {
        if (this.isInClosed(neighbor)) continue;

        const g = currentNode.g + this.getDistance(currentNode.state, neighbor);
        const neighborNode = new DjikstraNode(neighbor, currentNode, g);

        // If the neighbor is already in the open list, check if the new g is better
        const neighborPoint = new Point(neighborNode.id, neighborNode.lat, neighborNode.lon);
        if (this.isInOpen(neighborPoint)) {
          // Check if this new path to the neighbor is better (lower g value)
          const existingNode = this.openSet.get(neighborPoint) as DjikstraNode;
          if (existingNode && g < existingNode.g) {
            // Update the g value and parent
            existingNode.g = g;
            existingNode.parent = currentNode;

            // Since MinHeap doesn't support updating a node in place, we need to:
            // 1. Remove the existing node from the heap
            this.openList.data = this.openList.data.filter((node: DjikstraNode) => node !== existingNode);

            // 2. Re-insert the updated node into the heap
            this.openList.insert(existingNode);
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
