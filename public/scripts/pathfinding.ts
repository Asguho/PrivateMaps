import { aStar } from "./aStar.ts";
import { Djikstra } from "./djikstra.ts";
import { Graph } from "./graph.ts";
import { Point } from "./point.ts";
import { Path } from "./path.ts";
import { TileManager } from "./tileManager.ts";
import { AStarNode } from "./algo.ts";

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

	async run(tm: TileManager) {
		this.aStar = new aStar(this.graph, this.start, this.end);
		// this.end snapper til nærmeste tile også hvis den tilhører tile ikke er loeded
		//todo
		//load end tile DONE
		//fix find nearest tile to find last explored node and find nearest tile to that node DONE
		//then loop with a star until end is found or time limit is reached DONE
		//also async run() func DONE
		//HAPPY DAYS (NOT REALLY)
		const MAX_TRIES = 100;
		let tries = 0;
		let path, closedList;
		while (tries < MAX_TRIES) {
			({ path, closedList } = this.aStar.run(tm));
			if (!path) {
				const p = this.FindElementWithLowestH(closedList);
				if (!p) return { bestPath: null, explored: closedList };
				console.log("Last explored node:", p);
				this.graph = await tm.loadNearestTiles(p, tries);
				this.aStar = new aStar(this.graph, this.start, this.end);
			} else {
				break;
			}
			tries++;
		}

		/* //no-retry
		const { path, closedList } = this.aStar.run(tm);
		//console.log("Path found at try:", tries, path);
		if (!path) {
			const p = this.FindElementWithLowestH(closedList);
			if (!p) return { bestPath: null, explored: closedList };
			this.graph = await tm.loadNearestTile(p);
		}
		console.log("Path found", path);
		//end */

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

	FindElementWithLowestH(s: Set<AStarNode>): AStarNode | null {
		let lowestH = 1000000;
		let lowestNode: AStarNode | null = null;
		const allH: number[] = [];
		for (const node of s) {
			allH.push(node.h);
			if (node.h < lowestH) {
				lowestH = node.h;
				lowestNode = node;
			}
		}
		return lowestNode;
	}
}
