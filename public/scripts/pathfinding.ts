import { aStar } from './aStar.ts';
import { Djikstra } from './djikstra.ts';
import { Graph } from './graph.ts';
import { Point } from './point.ts';
import { Path } from './path.ts';

export class PathFinding {
  graph: Graph;
  start: Point;
  end: Point;
  aStar: aStar;
  djikstra: Djikstra;

  constructor(graph: Graph, start: Point, end: Point) {
    this.graph = graph;
    this.start = start;
    this.end = end;
    
  }
  calculateTotalDistance(path: Path, distances: Map<number | null, Map<number | null, number | null>>) {
    console.log("Path:", path);
    let totalDistance = 0;
    for (let i = 0; i < path.size() - 1; i++) {
      const point1 = path.points[i];
      const point2 = path.points[i + 1];
      const distance = distances.get(point1.id)?.get(point2.id) || 0;
      totalDistance += distance;
    }
    return totalDistance;
  }

  run() {
    this.aStar = new aStar(this.graph, this.start, this.end);
    this.djikstra = new Djikstra(this.graph, this.start, this.end);
    const aStarPath = this.aStar.run();
    const djikstraPath = this.djikstra.run();
    /*
        console.log("A* path:", aStarPath);
        console.log("Djikstra path:", djikstraPath);
        console.log("A* distances:", this.aStar.distances);
        console.log("Djikstra distances:", this.djikstra.distances);
        */
    const aStarDistance = this.calculateTotalDistance(aStarPath as Path, this.aStar.distances);
    const djikstraDistance = this.calculateTotalDistance(djikstraPath as Path, this.djikstra.distances);
    console.log(`A* distance: ${aStarDistance}, Djikstra distance: ${djikstraDistance}`);

    if (aStarDistance <= djikstraDistance) {
      return { bestPath: aStarPath, algorithm: 'A*' };
    } else {
      return { bestPath: djikstraPath, algorithm: 'Djikstra' };
    }
  }
  
}
