import { aStar } from "./aStar.ts";
import { Djikstra } from "./djikstra.ts";
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
	//@ts-ignore
	djikstra: Djikstra;

	constructor(graph: Graph, start: Point, end: Point) {
		this.graph = graph;
		this.start = start;
		this.end = end;
	}
	calculateTravelTime(path: Path, distances: Map<number | null, Map<number | null, number | null>>) {
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

	run(tm: TileManager) {
		this.aStar = new aStar(this.graph, this.start, this.end);
		// this.end snapper til nærmeste tile også hvis den tilhører tile ikke er loeded
		//todo
		//load end tile
		//fix find nearest tile to find last explored node and find nearest tile to that node
		//then loop with a star until end is found or time limit is reached
		//also async run() func
		//HAPPY DAYS
		const { path, closedList } = this.aStar.run(tm);
		if (!path) {
			const p = this.end;
			if (!p) return { bestPath: null, explored: closedList };
			tm.loadNearestTile(p);
		}
		if (path) {
			const aStarTime = this.calculateTravelTime(path, this.aStar.distances);
			const aStarDistance = path.calculateTotalDistance();
			console.log(`A* distance: ${aStarDistance}, A* time: ${aStarTime}`);
			return {
				bestPath: path,
				algorithm: "A*",
				distance: aStarDistance,
				time: aStarTime,
				explored: closedList,
			};
		} else {
			console.error("path is null");
			return { bestPath: null, explored: closedList };
		}
	}

	getLastElement(s: Set<Point>): Point | null {
		let lastElement = null;
		s.forEach((element) => {
			lastElement = element;
		});
		return lastElement;
	}
}
