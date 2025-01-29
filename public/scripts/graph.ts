import { Point } from './point.ts';
import { Edge } from './edge.ts';
import { Viewport } from './viewport.ts';

export class Graph {
  points: Point[];
  edges: Edge[];
  constructor(points: Point[] = [], edges: Edge[] = []) {
    this.points = points;
    this.edges = edges;
  }

  addPoint(point: Point) {
    this.points.push(point);
  }

  addEdge(edge: Edge) {
    this.edges.push(edge);
  }

  draw(ctx: CanvasRenderingContext2D, viewport: Viewport) {
    this.edges.forEach((edge) => edge.draw(ctx, viewport));
    this.points.forEach((point) => point.draw(ctx, viewport));
  }

  nearestEdge(lat: number, lon: number) {
    let nearestEdge = null;
    let nearestDistance = Infinity;
    let closestPoint = null;

    this.edges.forEach((edge) => {
      const { point1, point2 } = edge;
      const { closest, distance } = this.distanceToSegment(
        { y: lat, x: lon },
        { y: point1.lat, x: point1.lon },
        { y: point2.lat, x: point2.lon }
      );
      console.log(`Edge: ${edge}, Distance: ${distance}, isCarAllowed: ${edge.isCarAllowed}`);
      if (distance < nearestDistance && edge.isCarAllowed) {
        nearestDistance = distance;
        nearestEdge = edge;
        closestPoint = closest;
      }
    });

    return { edge: nearestEdge, closest: closestPoint };
  }

  placePointOnEdge(lat: number, lon: number) {
    const { edge, closest } = this.nearestEdge(lat, lon);
    console.log(edge);

    // @ts-ignore
    const { point1, point2 } = edge;

    /*         const t = ((x - x1) * (x2 - x1) + (y - y1) * (y2 - y1)) / ((x2 - x1) ** 2 + (y2 - y1) ** 2);
        const clampedT = Math.max(0, Math.min(1, t));
        const x0 = x1 + clampedT * (x2 - x1);
        const y0 = y1 + clampedT * (y2 - y1); */

    // @ts-ignore
    const newPoint = new Point(this.points.length + 1, closest.y, closest.x);
    console.log(newPoint);
    this.addPoint(newPoint);

    this.edges = this.edges.filter((e) => e !== edge);
    // @ts-ignore
    this.addEdge(new Edge(point1, newPoint, edge.type, edge.maxSpeed, edge.streetName));
    // @ts-ignore
    this.addEdge(new Edge(newPoint, point2, edge.type, edge.maxSpeed, edge.streetName));

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
    let t = ((pt.x - p1.x) * dx + (pt.y - p1.y) * dy) / (dx * dx + dy * dy);

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
