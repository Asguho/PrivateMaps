import { Algo, AStarNode } from './algo.ts';
import { Graph } from './graph.ts';
import { Point } from './point.ts';
import { MinHeap } from './minHeap.ts';

export class aStar extends Algo {
  openList: MinHeap<AStarNode>;
  constructor(graph: Graph, start: Point, end: Point) {
    super(graph, start, end);
    this.openList = new MinHeap<AStarNode>((a, b) => {
      if (a.f === b.f) {
        return a.h - b.h; // Use h as a tie-breaker
      }
      return a.f - b.f;
    });
    this.graph.edges.forEach(({ point1, point2, isCarAllowed }) => {

      if (!this.distances.has(point1.id)) this.distances.set(point1.id, new Map());
      if (!this.distances.has(point2.id)) this.distances.set(point2.id, new Map());
      const calculatedDistance = isCarAllowed ? this.distance(point1, point2) : null;
      this.distances.get(point1.id)?.set(point2.id, calculatedDistance);
      this.distances.get(point2.id)?.set(point1.id, calculatedDistance);
    });
  }

  popOpen() {
    return this.openList.pop();
  }

  addClosed(node: Point) {
    this.closedList.add(node);
  }

  isInClosed(point: Point) {
    return this.closedList.has(point);
  }

  run() {
    console.log(this.start, this.end);
    const startNode = new AStarNode(this.start, null, 0, this.distance(this.start, this.end));
    this.openList.insert(startNode);
    console.log("Start node:", startNode.f === startNode.g + startNode.h);
    while (!this.openList.isEmpty()) {

      // console.log("Current openList empty:", this.openListEmpty());
      const currentNode = this.popOpen();
      // console.log("Current node:", currentNode);
      // console.log("end:", this.end);
      if (!currentNode) {
        continue;
      }

      if (currentNode.equals(this.end)) {
        this.currentPath = this.reconstructPath(currentNode);
        return this.currentPath; // Return the path as an array of points
      }

      this.addClosed(currentNode);

      const neighbors = this.getNeighbors(currentNode);
      // console.log("Neighbors:", neighbors);

      for (const neighbor of neighbors) {
        if (this.isInClosed(neighbor)) continue;

        const distance = this.getDistance(currentNode, neighbor);
        
        
        const gScore = (currentNode as AStarNode).g + (distance ?? 0);
        const hScore = this.distance(neighbor, this.end);
        const fScore = gScore + hScore + 0.001 * hScore;
        /*
                console.log("gScore:", gScore);
                console.log("hScore:", hScore);
                console.log("fScore:", fScore);
                */

        const neighborNode = new AStarNode(neighbor, currentNode, gScore, hScore);

        const neighborNodeInSet = this.openSet.get(neighbor.id) as AStarNode;
        if (!neighborNodeInSet || neighborNodeInSet.f > fScore) {
          this.openSet.set(neighbor.id, neighborNode);  
          this.openList.insert(neighborNode);           
        }
      }
    }

    return null; // No path found
  }
  getDistance(point1: Point, point2: Point): number | null {
    return this.distances.get(point1.id)?.get(point2.id) || null;
  }
  
}
