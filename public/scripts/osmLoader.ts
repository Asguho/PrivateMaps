import { Point } from './point.ts';
import { Edge } from './edge.ts';
import { Graph } from './graph.ts';

export class OsmLoader {
    points: Point[];
    edges: Edge[];
    constructor() {
        this.points = [];
        this.edges = [];
    }

    async load(latStart: number, lonStart: number, latEnd: number, lonEnd: number) {
        const result = await fetch(
            //"https://overpass-api.de/api/interpreter",
            'http://localhost:8000/api',
            {
                method: 'POST',
                // The body contains the query
                // to understand the query language see "The Programmatic Query Language" on
                // https://wiki.openstreetmap.org/wiki/Overpass_API#The_Programmatic_Query_Language_(OverpassQL)
                cache: 'force-cache',
                body: 'data=' +
                    encodeURIComponent(`
[out:json][timeout:25];
// gather results
(
  way["highway"](${latStart},${lonStart},${latEnd},${lonEnd});
);
// print results
out geom;
        `),
            },
        ).then((data) => data.json());
        const performanceStart = performance.now();
        for (const point of result.graph.points) {
            this.points.push(new Point(point.id, point.lat, point.lon));
        }
        for (const edge of result.graph.edges) {
            this.edges.push(new Edge(edge.id, edge.from, edge.to, edge.highway, edge.maxspeed, edge.name, edge.oneway, edge.junction));
        }
        const neighborsMap = new Map<number, Point[]>();
        for (const [key, value] of Object.entries(result.neighbors)) {
            neighborsMap.set(Number(key), value as Point[]);
        }
        console.log('Loaded', this.points.length, 'points and', this.edges.length, 'edges in ', performance.now() - performanceStart, 'ms');

        return new Graph(
            this.points,
            this.edges,
            neighborsMap,
        );
    }
}
