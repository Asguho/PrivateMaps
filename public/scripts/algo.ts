import { Graph } from './graph.ts';
import { Point } from './point.ts';
import { MinHeap } from './minHeap.ts';
import { Edge } from './edge.ts';

export class Node extends Point {
  parent: Node | null;

  constructor(point: Point, parent: Node | null) {
    super(point.id, point.lat, point.lon);
    this.parent = parent;
  }
}

export class AStarNode extends Node {
  g: number; // The distance from the start node
  h: number; // The distance to the end node
  f: number; // The sum of g and h

  constructor(point: Point, parent: Node | null, g: number, h: number) {
    super(point, parent);
    this.g = g;
    this.h = h;
    this.f = g + h;
  }
}

export class DjikstraNode extends Node {
  g: number; // The distance from the start node

  constructor(point: Point, parent: Node | null, g: number) {
    super(point, parent);
    this.g = g;
  }
}

export class Algo {
  graph: Graph;
  start: Point;
  end: Point;
  openSet: Map<Point, Node>;
  openList: MinHeap;
  distances: Map<number | null, Map<number | null, number | null>>;
  closedList: Set<Point>;
  currentPath: Point[];

  constructor(graph: Graph, start: Point, end: Point) {
    this.graph = graph;
    this.start = start;
    this.end = end;
    this.openSet = new Map();
    this.currentPath = [];
    this.distances = new Map();
    this.closedList = new Set();
    this.openList = new MinHeap((a, b) => a.f - b.f);
  }
  distance(node: Point, goal: Point) {
    // Haversine heuristic
    const R = 6371e3;
    const [lat1, lon1] = [node.lat, node.lon];
    const [lat2, lon2] = [goal.lat, goal.lon];
    const toRadians = (degrees: number) => (degrees * Math.PI) / 180;
    const dLat = toRadians(lat2 - lat1);
    const dLon = toRadians(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c;
  }

  reconstructPath(node: Node | null) {
    const path = [];
    while (node) {
      const point = node; // pisse idiotisk, men det er fordi Djikstra og A* har forskellige node objekter
      path.push(point); // Add to the end
      node = node.parent;
    }
    return path.reverse(); // Reverse the array once
  }

  openListEmpty() {
    return this.openList.data.length === 0;
  }
  getNeighbors(point: Point) {
    return this.graph.edges
      .filter(({ point1, point2, isCarAllowed }) => isCarAllowed && (point1.id === point.id || point2.id === point.id))
      .map(({ point1, point2 }) => (point1.id === point.id ? point2 : point1));
  }

  createGraphWithOptimalPath() {
    const newGraph = new Graph();
    const pointSet = new Set<Point>();

    for (let i = 0; i < this.currentPath.length - 1; i++) {
      const point1: Point = this.currentPath[i];
      const point2: Point = this.currentPath[i + 1];
      newGraph.addEdge(new Edge(point1, point2, 'true', 20, 'optimal'));
      pointSet.add(point1);
      pointSet.add(point2);
    }

    newGraph.points = Array.from(pointSet);
    console.log('Optimal path graph:', newGraph);
    return newGraph;
  }
}
