import { Graph } from './graph.ts';
import { Point } from './point.ts';

export class Algo {
  graph: Graph;
  start: Point;
  end: Point;
  openSet: Map<number, number>;
  distances: Map<number, Map<number, number>>;
  closedList: Set<number>;

  constructor(graph: Graph, start: Point, end: Point) {
    this.graph = graph;
    this.start = start;
    this.end = end;
    this.openSet = new Map();
    this.path = [];
    this.distances = new Map();
    this.closedList = new Set();
  }
  distance(node, goal) {
    // Haversine heuristic
    const R = 6371e3;
    const [lat1, lon1] = [node.lat, node.lon];
    const [lat2, lon2] = [goal.lat, goal.lon];
    const toRadians = (degrees) => (degrees * Math.PI) / 180;
    const dLat = toRadians(lat2 - lat1);
    const dLon = toRadians(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c;
  }

  reconstructPath(node) {
    const path = [];
    while (node) {
      const point = node.state ? node.state : node.point; // pisse idiotisk, men det er fordi Djikstra og A* har forskellige node objekter
      path.push(point); // Add to the end
      node = node.parent;
    }
    return path.reverse(); // Reverse the array once
  }

  openListEmpty() {
    return this.openList.data.length === 0;
  }
  getNeighbors(point) {
    return this.graph.edges
      .filter(({ point1, point2, isCarAllowed }) => isCarAllowed && (point1.id === point.id || point2.id === point.id))
      .map(({ point1, point2 }) => (point1.id === point.id ? point2 : point1));
  }

  createGraphWithOptimalPath() {
    const newGraph = { points: [], edges: [] };
    const pointSet = new Set();

    for (let i = 0; i < this.path.length - 1; i++) {
      const point1 = this.path[i];
      const point2 = this.path[i + 1];
      const distance = this.getDistance(point1, point2);
      newGraph.edges.push({ point1, point2, distance });
      pointSet.add(point1);
      pointSet.add(point2);
    }

    newGraph.points = Array.from(pointSet);
    console.log('Optimal path graph:', newGraph);
    return newGraph;
  }
}
