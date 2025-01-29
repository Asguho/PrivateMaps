import { MinHeap } from './minheap.js';
import { Algo } from './algo.ts';
import { Graph } from './graph.ts';
import { Point } from './point.ts';

export class DjikstraNode {
  constructor(state, parent, g) {
    this.state = state;
    this.parent = parent;
    this.g = g; // The distance from the start node
  }
}

export class Djikstra extends Algo {
  constructor(graph: Graph, start: Point, end: Point) {
    super(graph, start, end);
    this.openList = new MinHeap((a, b) => a.g - b.g); // MinHeap for efficiency
    this.graph.edges.forEach(({ point1, point2, isCarAllowed }) => {
      if (!this.distances.has(point1.id)) this.distances.set(point1.id, new Map());
      if (!this.distances.has(point2.id)) this.distances.set(point2.id, new Map());
      const calculatedDistance = isCarAllowed ? this.distance(point1, point2) : Infinity;
      this.distances.get(point1.id).set(point2.id, calculatedDistance);
      this.distances.get(point2.id).set(point1.id, calculatedDistance);
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
      if (currentNode.state.id === this.end.id) {
        this.path = this.reconstructPath(currentNode);
        return this.path; // Return the path as an array of points
      }

      // Mark current node as visited
      this.addClosed(currentNode);

      const neighbors = this.getNeighbors(currentNode.state);
      for (const neighbor of neighbors) {
        if (this.isInClosed(neighbor)) continue;

        const g = currentNode.g + this.getDistance(currentNode.state, neighbor);
        let neighborNode = new DjikstraNode(neighbor, currentNode, g);

        // If the neighbor is already in the open list, check if the new g is better
        if (this.isInOpen(neighborNode.state)) {
          // Check if this new path to the neighbor is better (lower g value)
          const existingNode = this.openSet.get(neighborNode.state.id);
          if (existingNode && g < existingNode.g) {
            // Update the g value and parent
            existingNode.g = g;
            existingNode.parent = currentNode;

            // Since MinHeap doesn't support updating a node in place, we need to:
            // 1. Remove the existing node from the heap
            this.openList.data = this.openList.data.filter((node) => node !== existingNode);

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
  getDistance(point1, point2) {
    return this.distances.get(point1.id)?.get(point2.id) ?? Infinity;
  }
}
