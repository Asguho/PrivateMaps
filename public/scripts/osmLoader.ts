import { Point } from "./point.ts";
import { Edge } from "./edge.ts";
import { Graph } from "./graph.ts";

export class OsmLoader {
	points: Point[];
	edges: Edge[];
	constructor() {
		this.points = [];
		this.edges = [];
	}

	async load(
		latStart: number,
		lonStart: number,
		latEnd: number,
		lonEnd: number,
	) {
		const result = await fetch(
			`/api?latStart=${latStart}&lonStart=${lonStart}&latEnd=${latEnd}&lonEnd=${lonEnd}`,
		).then((data) => data.json());
		const performanceStart = performance.now();
		for (const point of result.graph.points) {
			this.points.push(new Point(point.id, point.lat, point.lon));
		}
		for (const edge of result.graph.edges) {
			this.edges.push(
				new Edge(
					edge.id,
					edge.from,
					edge.to,
					edge.highway,
					edge.maxspeed,
					edge.name,
					edge.oneway,
					edge.junction,
				),
			);
		}
		const neighborsMap = new Map<number, Point[]>();
		for (const [key, value] of Object.entries(result.neighbors)) {
			neighborsMap.set(Number(key), value as Point[]);
		}
		return new Graph(this.points, this.edges, neighborsMap);
	}
}
