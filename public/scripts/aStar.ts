import { Graph } from "./graph.ts";
import { Point } from "./point.ts";
import { MinHeap } from "./minHeap.ts";
import { TileManager } from "./tileManager.ts";
import { Path } from "./path.ts";

class Node extends Point {
	parent: Node | null;

	constructor(point: Point, parent: Node | null) {
		super(point.id, point.lat, point.lon);
		this.parent = parent;
	}
}

class AStarNode extends Node {
	g: number;
	h: number;
	f: number;

	constructor(point: Point, parent: Node | null, g: number, h: number) {
		super(point, parent);
		this.g = g;
		this.h = h;
		this.f = g + h * 1.3;
	}
}

export class aStar {
	openList: MinHeap<AStarNode>;
	avgSpeed: number;
	tileManager: TileManager;
	graph: Graph;
	start: Point;
	end: Point;
	openSet: Map<number, Node>;
	distances: Map<number | null, Map<number | null, number | null>>;
	closedList: Set<Point>;
	currentPath: Path;

	constructor(graph: Graph, start: Point, end: Point, tileManager: TileManager) {
		this.graph = graph;
		this.start = start;
		this.end = end;
		this.openSet = new Map();
		this.currentPath = new Path([], "red");
		this.distances = new Map();
		this.closedList = new Set();
		this.openList = new MinHeap<AStarNode>((a, b) => {
			if (a.f === b.f) {
				return a.h - b.h;
			}
			return a.f - b.f;
		});
		this.tileManager = tileManager;
		this.graph.edges.forEach(({ point1, point2, isCarAllowed, maxSpeed }) => {
			if (!this.distances.has(point1.id)) {
				this.distances.set(point1.id, new Map());
			}
			if (!this.distances.has(point2.id)) {
				this.distances.set(point2.id, new Map());
			}
			const calculatedDistance = this.distance(point1, point2);
			const travelTime =
				isCarAllowed && maxSpeed > 0 ? calculatedDistance / (maxSpeed / 3.6) : null;
			this.distances.get(point1.id)?.set(point2.id, travelTime);
			this.distances.get(point2.id)?.set(point1.id, travelTime);
		});
		this.avgSpeed = this.getWeightedAverageSpeed();
		console.log("Average speed:", this.avgSpeed);
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

	async run() {
		console.log(this.start, this.end);
		const startNode = new AStarNode(
			this.start,
			null,
			0,
			this.Timedheuristic(this.start, this.end),
		);
		this.openList.insert(startNode);
		while (!this.openList.isEmpty()) {
			const currentNode = this.popOpen();
			if (!currentNode) {
				continue;
			}

			if (currentNode.id === this.end.id) {
				this.currentPath = this.reconstructPath(currentNode);
				return { path: this.currentPath, closedList: this.closedList };
			}

			if (!this.tileManager.isTileLoaded(currentNode.lat, currentNode.lon)) {
				const tile = await this.tileManager.loadTileAsync(
					currentNode.lat,
					currentNode.lon,
					this.tileManager.viewport,
				);
				const graph = this.tileManager.mergeGraph(
					this.tileManager.getAllTileGraphs().filter((g): g is Graph => g !== null),
				);
				this.graph = graph;
				if (tile?.graph) {
					tile.graph.edges.forEach(({ point1, point2, isCarAllowed, maxSpeed }) => {
						if (!this.distances.has(point1.id)) {
							this.distances.set(point1.id, new Map());
						}
						if (!this.distances.has(point2.id)) {
							this.distances.set(point2.id, new Map());
						}
						const calculatedDistance = this.distance(point1, point2);
						const travelTime =
							isCarAllowed && maxSpeed > 0
								? calculatedDistance / (maxSpeed / 3.6)
								: null;
						this.distances.get(point1.id)?.set(point2.id, travelTime);
						this.distances.get(point2.id)?.set(point1.id, travelTime);
					});
				}
			}

			this.addClosed(currentNode);

			const neighbors = this.getNeighbors(currentNode);

			for (const neighbor of neighbors) {
				if (this.isInClosed(neighbor)) continue;

				const distance = this.getDistance(currentNode, neighbor);
				if (distance === null) {
					continue;
				}
				const gScore = (currentNode as AStarNode).g + distance;
				const hScore = this.Timedheuristic(neighbor, this.end);
				const fScore = gScore + hScore * 1.3;

				const neighborNode = new AStarNode(neighbor, currentNode, gScore, hScore);

				const neighborNodeInSet = this.openSet.get(neighbor.id) as AStarNode;
				if (!neighborNodeInSet || neighborNodeInSet.f > fScore) {
					this.openSet.set(neighbor.id, neighborNode);
					this.openList.insert(neighborNode);
				}
			}
		}
		console.error("No path found", this.closedList);
		return { path: null, closedList: this.closedList };
	}

	getDistance(point1: Point, point2: Point): number | null {
		return this.distances.get(point1.id)?.get(point2.id) || null;
	}

	getWeightedAverageSpeed() {
		let totalWeightedSpeed = 0;
		let totalDistance = 0;

		this.graph.edges.forEach(({ point1, point2, isCarAllowed, maxSpeed }) => {
			if (isCarAllowed && maxSpeed > 0) {
				const distance = this.distance(point1, point2);
				totalWeightedSpeed += maxSpeed * distance;
				totalDistance += distance;
			}
		});

		return totalDistance > 0 ? totalWeightedSpeed / totalDistance : 0;
	}

	Timedheuristic(point1: Point, point2: Point) {
		const R = 6371e3; // Jordens radius i meter
		const [lat1, lon1] = [point1.lat, point1.lon];
		const [lat2, lon2] = [point2.lat, point2.lon];
		const toRadians = (degrees: number) => (degrees * Math.PI) / 180;

		const dLat = toRadians(lat2 - lat1);
		const dLon = toRadians(lon2 - lon1);

		const a =
			Math.sin(dLat / 2) * Math.sin(dLat / 2) +
			Math.cos(toRadians(lat1)) *
				Math.cos(toRadians(lat2)) *
				Math.sin(dLon / 2) *
				Math.sin(dLon / 2);
		const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
		const distance = R * c;
		return distance / this.avgSpeed;
	}
	distance(node: Point, goal: Point) {
		const R = 6371e3;
		const [lat1, lon1] = [node.lat, node.lon];
		const [lat2, lon2] = [goal.lat, goal.lon];
		const toRadians = (degrees: number) => (degrees * Math.PI) / 180;
		const dLat = toRadians(lat2 - lat1);
		const dLon = toRadians(lon2 - lon1);
		const a =
			Math.sin(dLat / 2) * Math.sin(dLat / 2) +
			Math.cos(toRadians(lat1)) *
				Math.cos(toRadians(lat2)) *
				Math.sin(dLon / 2) *
				Math.sin(dLon / 2);
		const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
		return R * c;
	}

	reconstructPath(node: Node | null) {
		const path: Node[] = [];
		while (node) {
			path.push(node);
			node = node.parent;
		}
		const finalpath = new Path(path.reverse(), "blue");
		return finalpath;
	}

	getNeighbors(point: Point) {
		return this.graph.neighbors.get(point.id) || [];
	}

}
