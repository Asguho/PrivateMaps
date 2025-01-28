import { Point } from './point.js';
import { Edge } from './edge.js';

export class Graph {
    constructor(points = [], edges = []) {
        this.points = points;
        this.edges = edges;
    }

    addPoint(point) {
        this.points.push(point);
    }

    addEdge(edge) {
        this.edges.push(edge);
    }

    draw(ctx, viewport) {
        this.edges.forEach(edge => edge.draw(ctx, viewport));
        this.points.forEach(point => point.draw(ctx, viewport));
    }


    nearestEdge(lat, lon) {
        let nearestEdge = null;
        let nearestDistance = Infinity;
        let closestPoint = null;

        this.edges.forEach(edge => {
            const { point1, point2 } = edge;
            let {closest, distance} = this.distanceToSegment({y: lat, x: lon}, {y:point1.lat, x:point1.lon}, {y:point2.lat, x:point2.lon});
            //console.log(distance);
            if (distance < nearestDistance && edge.isCarAllowed) {
                nearestDistance = distance;
                nearestEdge = edge;
                closestPoint = closest;
            }
        });

        return {edge: nearestEdge, closest: closestPoint};
    }

    placePointOnEdge(lat, lon) {
        const {edge, closest} = this.nearestEdge(lat, lon);
        console.log(edge);
        const { point1, point2 } = edge;

/*         const t = ((x - x1) * (x2 - x1) + (y - y1) * (y2 - y1)) / ((x2 - x1) ** 2 + (y2 - y1) ** 2);
        const clampedT = Math.max(0, Math.min(1, t));
        const x0 = x1 + clampedT * (x2 - x1);
        const y0 = y1 + clampedT * (y2 - y1); */

        const newPoint = new Point(this.points.length + 1, closest.y, closest.x);
        console.log(newPoint);
        this.addPoint(newPoint);

        // Remove the original ed
        // 
        // ge and add two new edges
        this.edges = this.edges.filter(e => e !== edge);
        this.addEdge(new Edge(point1, newPoint, edge.type, edge.maxspeed, edge.streetName));
        this.addEdge(new Edge(newPoint, point2, edge.type, edge.maxspeed, edge.streetName));

        return newPoint;
    }

        distanceToSegment(pt, p1, p2) {
        let closest = { x: 0, y: 0 };
    
        let dx = p2.x - p1.x;
        let dy = p2.y - p1.y;
    
        // Handle case where the segment is just a single point.
        if (dx === 0 && dy === 0) {
            closest = { x: p1.x, y: p1.y };
            dx = pt.x - p1.x;
            dy = pt.y - p1.y;
            return {closest, distance: Math.sqrt(dx * dx + dy * dy)};
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
    
        return {closest, distance: Math.sqrt(dx * dx + dy * dy)};
    }
}