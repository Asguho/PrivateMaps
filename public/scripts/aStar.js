import { MinHeap } from './minheap.js';
import { Algo } from './algo.js';

export class aStar extends Algo {
    constructor(graph, start, end) {
        super(graph, start, end);
        this.openList = new MinHeap((a, b) => a.f - b.f); // MinHeap for efficiency
        this.graph.edges.forEach(({ point1, point2, isCarAllowed }) => {
            if (!this.distances.has(point1.id)) this.distances.set(point1.id, new Map());
            if (!this.distances.has(point2.id)) this.distances.set(point2.id, new Map());
            const calculatedDistance = isCarAllowed ? this.distance(point1, point2) : null;
            this.distances.get(point1.id).set(point2.id, calculatedDistance);
            this.distances.get(point2.id).set(point1.id, calculatedDistance);
        });
    }


    popOpen() {
        return this.openList.pop();
    }

    addClosed(node) {
        this.closedList.add(node.point);
    }

    isInClosed(point) {
        return this.closedList.has(point);
    }


    run() {
        console.log(this.start, this.end);
        let startNode = { point: this.start, parent: null, g: 0, f: this.distance(this.start, this.end) };
        this.openList.insert(startNode);
        

        while (!this.openListEmpty()) {
           // console.log("Current openList empty:", this.openListEmpty());
            const currentNode = this.popOpen();
           // console.log("Current node:", currentNode);
           // console.log("end:", this.end);
            if (currentNode.point === this.end) {
                this.path = this.reconstructPath(currentNode);
                return this.path; // Return the path as an array of points
            }

            this.addClosed(currentNode);

            const neighbors = this.getNeighbors(currentNode.point);
           // console.log("Neighbors:", neighbors);

            for (const neighbor of neighbors) {
                if (this.isInClosed(neighbor)) continue;

                const gScore = currentNode.g + this.getDistance(currentNode.point, neighbor);
                const hScore = this.distance(neighbor, this.end);
                const fScore = gScore + hScore + 0.001 * hScore;
                /*
                console.log("gScore:", gScore);
                console.log("hScore:", hScore);
                console.log("fScore:", fScore);
                */

                const neighborNode = {
                    point: neighbor,
                    parent: currentNode,
                    g: gScore,
                    h: hScore,
                    f: fScore
                };

                if (!this.openSet.has(neighbor) || this.openSet.get(neighbor).f > fScore) {
                    this.openSet.set(neighbor, neighborNode);
                    this.openList.insert(neighborNode);
                }
            }
        }

        return null; // No path found
    }
    getDistance(point1, point2) {
        return this.distances.get(point1.id)?.get(point2.id) || null;
    }
    
}