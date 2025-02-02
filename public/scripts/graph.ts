import { Point } from './point.ts';
import { Edge } from './edge.ts';
import { Viewport } from './viewport.ts';

export class Graph {
    points: Point[];
    edges: Edge[];
    neighbors: Map<number, number[]>;
    constructor(points: Point[] = [], edges: Edge[] = [], neighbors: Map<number, number[]> = new Map()) {
        this.points = points;
        this.edges = edges;
        this.neighbors = neighbors;
    }

    addPoint(point: Point) {
        this.points.push(point);
    }

    addEdge(edge: Edge) {
        this.edges.push(edge);
    }

    draw(ctx: CanvasRenderingContext2D, viewport: Viewport) {
        this.edges.forEach((edge) => edge.draw(ctx, viewport));
    }

    nearestEdge(lat: number, lon: number) {
        let nearestEdge: Edge | null = null;
        let nearestDistance = Infinity;
        let closestPoint: { x: number; y: number } | null = null;

        this.edges.forEach((edge) => {
            const { point1, point2 } = edge;
            const { closest, distance } = this.distanceToSegment(
                { y: lat, x: lon },
                { y: point1.lat, x: point1.lon },
                { y: point2.lat, x: point2.lon },
            );
            //console.log(`Edge: ${edge}, Distance: ${distance}, isCarAllowed: ${edge.isCarAllowed}`);
            if (distance < nearestDistance && edge.isCarAllowed) {
                nearestDistance = distance;
                nearestEdge = edge;
                closestPoint = closest;
            }

            return { closest, distance };
        });

        return { edge: nearestEdge, closest: closestPoint };
    }

    placePointOnEdge(lat: number, lon: number) {
        const { edge, closest } = this.nearestEdge(lat, lon);
        console.log(edge);

        // @ts-ignore edge is not null but wth
        const { point1, point2 } = edge;

        // @ts-ignore closest is not null but wth
        const newPoint = new Point(this.points.length + 1, closest.y, closest.x);
        console.log(newPoint);
        this.addPoint(newPoint);

        this.edges = this.edges.filter((e) => e !== edge);
        // @ts-ignore edge is not null but wth
        this.addEdge(new Edge(edge.id, point1, newPoint, edge.type, edge.maxSpeed, edge.streetName, edge.oneway, edge.junction));
        // @ts-ignore edge is not null but wth
        this.addEdge(new Edge(edge.id, newPoint, point2, edge.type, edge.maxSpeed, edge.streetName, edge.oneway, edge.junction));

        return newPoint;
    }
    distanceToSegment(pt: { x: number; y: number }, p1: { x: number; y: number }, p2: { x: number; y: number }) {
        let closest = { x: 0, y: 0 };

        let dx = p2.x - p1.x;
        let dy = p2.y - p1.y;

        // Handle case where the segment is just a single point.
        if (dx === 0 && dy === 0) {
            closest = { x: p1.x, y: p1.y };
            dx = pt.x - p1.x;
            dy = pt.y - p1.y;
            return { closest, distance: Math.sqrt(dx * dx + dy * dy) };
        }

        // Calculate the parameter t that minimizes the distance.
        const t = ((pt.x - p1.x) * dx + (pt.y - p1.y) * dy) / (dx * dx + dy * dy);

        // Clamp t to the range [0, 1] to ensure the closest point lies on the segment.
        if (t < 0) {
            closest = { x: p1.x, y: p1.y };
        } else if (t > 1) {
            closest = { x: p2.x, y: p2.y };
        } else {
            closest = { x: p1.x + t * dx, y: p1.y + t * dy };
        }

        dx = pt.x - closest.x;
        dy = pt.y - closest.y;

        return { closest, distance: Math.sqrt(dx * dx + dy * dy) };
    }
}
