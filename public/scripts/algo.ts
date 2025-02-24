import { Graph } from './graph.ts';
import { Point } from './point.ts';
import { Edge } from './edge.ts';
import { Path } from './path.ts';

export class Node extends Point {
    parent: Node | null;

    constructor(point: Point, parent: Node | null) {
        super(point.id, point.lat, point.lon);
        this.parent = parent;
    }
}

export class AStarNode extends Node {
    g: number; // The distance from the start node
    h: number; // The distance to the end node
    f: number; // The sum of g and h

    constructor(point: Point, parent: Node | null, g: number, h: number) {
        super(point, parent);
        this.g = g;
        this.h = h;
        this.f = g + (h * 1.3);
    }
}

export class DjikstraNode extends Node {
    g: number; // The distance from the start node

    constructor(point: Point, parent: Node | null, g: number) {
        super(point, parent);
        this.g = g;
    }
}

export class Algo {
    graph: Graph;
    start: Point;
    end: Point;
    openSet: Map<number, Node>;
    distances: Map<number | null, Map<number | null, number | null>>;
    closedList: Set<Point>;
    //@ts-ignore
    currentPath: Path;

    constructor(graph: Graph, start: Point, end: Point) {
        this.graph = graph;
        this.start = start;
        this.end = end;
        this.openSet = new Map();
        //@ts-ignore
        this.currentPath;
        this.distances = new Map();
        this.closedList = new Set();
    }
    distance(node: Point, goal: Point) {
        // Haversine heuristic
        const R = 6371e3;
        const [lat1, lon1] = [node.lat, node.lon];
        const [lat2, lon2] = [goal.lat, goal.lon];
        const toRadians = (degrees: number) => (degrees * Math.PI) / 180;
        const dLat = toRadians(lat2 - lat1);
        const dLon = toRadians(lon2 - lon1);
        const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        if (isNaN(R * c)) console.log('Distance:', R * c);
        return R * c;
    }

    reconstructPath(node: Node | null) {
        const path: Node[] = [];
        while (node) {
            path.push(node); // Add to the end
            node = node.parent;
        }
        const finalpath = new Path(path.reverse(), 'blue'); // Reverse the array once
        return finalpath;
    }

    getNeighbors(point: Point) {
        return this.graph.neighbors.get(point.id) || [];
    }

    createGraphWithOptimalPath() {
        const newGraph = new Graph();
        const pointSet = new Set<Point>();

        for (let i = 0; i < this.currentPath.size() - 1; i++) {
            //@ts-ignore
            const point1: Point = this.currentPath[i];
            //@ts-ignore
            const point2: Point = this.currentPath[i + 1];
            newGraph.addEdge(new Edge(-1, point1, point2, 'true', 20, 'optimal', false, false));
            pointSet.add(point1);
            pointSet.add(point2);
        }

        newGraph.points = Array.from(pointSet);
        console.log('Optimal path graph:', newGraph);
        return newGraph;
    }
}
