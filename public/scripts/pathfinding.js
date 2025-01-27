
//find best path from both astar and djikstra
import { aStar } from "./aStar.js";
import { Djikstra } from "./djikstra.js";
export class PathFinding {
    constructor(graph, start, end) {
        this.graph = graph;
        this.start = start;
        this.end = end;
        this.aStar = new aStar(graph, start, end);
        this.djikstra = new Djikstra(graph, start, end);
    }
    calculateTotalDistance(path, distances) {
        let totalDistance = 0;
        for (let i = 0; i < path.length - 1; i++) {
            const point1 = path[i];
            const point2 = path[i + 1];
            totalDistance += distances.get(point1.id)?.get(point2.id) || 0;
        }
        return totalDistance;
    }
    run() {
        const aStarPath = this.aStar.run();
        const djikstraPath = this.djikstra.run();
        const aStarDistance = calculateTotalDistance(aStarPath, this.aStar.distances);
        const djikstraDistance = calculateTotalDistance(djikstraPath, this.djikstra.distances);
        if (aStarDistance < djikstraDistance) {
            return { bestPath: aStarPath, algorithm: 'A*' };
        } else {
            return { bestPath: djikstraPath, algorithm: 'Djikstra' };
        }
    }
    
}