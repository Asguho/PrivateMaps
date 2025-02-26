import { aStar } from "./aStar.ts";
import { Graph } from "./graph.ts";
import { Point } from "./point.ts";
import { Path } from "./path.ts";
import { TileManager } from "./tileManager.ts";

export class PathFinding {
	graph: Graph;
	start: Point;
	end: Point;
	//@ts-ignore
	aStar: aStar;
	tileManager: TileManager;

	constructor(graph: Graph, start: Point, end: Point, tileManager: TileManager) {
		this.graph = graph;
		this.start = start;
		this.end = end;
		this.tileManager = tileManager;
	}

	calculateTravelTime(
		path: Path,
		distances: Map<number | null, Map<number | null, number | null>>,
	) {
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

	async run() {
		this.aStar = new aStar(this.graph, this.start, this.end, this.tileManager);
		const { path: aStarPath, closedList } = await this.aStar.run();
		if (aStarPath) {
			const aStarTime = this.calculateTravelTime(aStarPath, this.aStar.distances);
			const aStarDistance = aStarPath.calculateTotalDistance();
			console.log(`A* distance: ${aStarDistance}, A* time: ${aStarTime}`);
			return {
				bestPath: aStarPath,
				algorithm: "A*",
				distance: aStarDistance,
				time: aStarTime,
				explored: closedList,
			};
		} else {
			console.error("One of the paths is null");
			return { bestPath: null, explored: closedList };
		}
	}
}
