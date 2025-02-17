import { Algo, AStarNode } from './algo.ts';
import { Graph } from './graph.ts';
import { Point } from './point.ts';
import { MinHeap } from './minHeap.ts';

export class aStar extends Algo {
    openList: MinHeap<AStarNode>;
    avgSpeed: number;
    constructor(graph: Graph, start: Point, end: Point) {
        super(graph, start, end);
        this.openList = new MinHeap<AStarNode>((a, b) => {
            if (a.f === b.f) {
                return a.h - b.h; // Use h as a tie-breaker
            }
            return a.f - b.f;
        });
        this.graph.edges.forEach(({ point1, point2, isCarAllowed, maxSpeed }) => {
            if (!this.distances.has(point1.id)) {
                this.distances.set(point1.id, new Map());
            }
            if (!this.distances.has(point2.id)) {
                this.distances.set(point2.id, new Map());
            }
            const calculatedDistance = this.distance(point1, point2);
            const travelTime = isCarAllowed && maxSpeed > 0 ? calculatedDistance / (maxSpeed / 3.6) : null;
            this.distances.get(point1.id)?.set(point2.id, travelTime);
            this.distances.get(point2.id)?.set(point1.id, travelTime);
        });
        this.avgSpeed = this.getWeightedAverageSpeed();
        console.log('Average speed:', this.avgSpeed);
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

    run() {
        console.log(this.start, this.end);
        console.log('ends neightbors:', this.graph.neighbors.get(this.end.id));
        const startNode = new AStarNode(this.start, null, 0, this.heuristic(this.start, this.end));
        this.openList.insert(startNode);
        console.log('Start node:', startNode.f === startNode.g + startNode.h);
        while (!this.openList.isEmpty()) {
            // console.log("Current list length:", this.openList.heap.length);

            // console.log("Current openList empty:", this.openListEmpty());
            const currentNode = this.popOpen();
            // console.log("Current node:", currentNode);
            // console.log("end:", this.end);
            if (!currentNode) {
                continue;
            }

            if (currentNode.id === this.end.id) {
                this.currentPath = this.reconstructPath(currentNode);
                return { path: this.currentPath, closedList: this.closedList }; // Return the path as an array of points
            }

            this.addClosed(currentNode);

            const neighbors = this.getNeighbors(currentNode);
            // console.log("Neighbors:", neighbors);

            for (const neighbor of neighbors) {
                if (this.isInClosed(neighbor)) continue;

                const distance = this.getDistance(currentNode, neighbor);

                const gScore = (currentNode as AStarNode).g + (distance ?? 0);
                const hScore = this.heuristic(neighbor, this.end);
                const fScore = gScore + hScore + 0.001 * hScore;
                /*
                console.log("gScore:", gScore);
                console.log("hScore:", hScore);
                console.log("fScore:", fScore);
                */

                const neighborNode = new AStarNode(neighbor, currentNode, gScore, hScore);

                const neighborNodeInSet = this.openSet.get(neighbor.id) as AStarNode;
                if (!neighborNodeInSet || neighborNodeInSet.f > fScore) {
                    this.openSet.set(neighbor.id, neighborNode);
                    this.openList.insert(neighborNode);
                }
            }
        }
        console.error('No path found', this.closedList);
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
                const distance = this.distance(point1, point2); // in meters
                totalWeightedSpeed += maxSpeed * distance; // weighted speed
                totalDistance += distance; // sum of weights
            }
        });

        // Avoid division by zero
        return totalDistance > 0 ? totalWeightedSpeed / totalDistance : 0;
    }
    heuristic(point1: Point, point2: Point) {
        const R = 6371e3; // Earth's radius in meters
        const [lat1, lon1] = [point1.lat, point1.lon];
        const [lat2, lon2] = [point2.lat, point2.lon];
        const toRadians = (degrees: number) => (degrees * Math.PI) / 180;

        const dLat = toRadians(lat2 - lat1);
        const dLon = toRadians(lon2 - lon1);

        const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        const distance = R * c;
        return distance / this.avgSpeed;
    }
}
