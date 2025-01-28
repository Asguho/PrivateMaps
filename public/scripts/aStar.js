import { MinHeap } from './minheap.js';

export class aStar {
    constructor(graph, start, end) {
        this.graph = graph;
        this.start = start;
        this.end = end;
        this.closedList = new Set();
        this.path = [];
        this.openMap = new Map();
        this.openList = new MinHeap((a, b) => a.f - b.f); // MinHeap for efficiency

        // Prepare distance matrix
        this.distances = new Map();
        this.graph.edges.forEach(({ point1, point2, isCarAllowed }) => {
            if (!this.distances.has(point1.id)) this.distances.set(point1.id, new Map());
            if (!this.distances.has(point2.id)) this.distances.set(point2.id, new Map());
            const calculatedDistance = isCarAllowed ? this.heuristic(point1, point2) : Infinity;
            this.distances.get(point1.id).set(point2.id, calculatedDistance);
            this.distances.get(point2.id).set(point1.id, calculatedDistance);
        });
        
    }

    openListEmpty() {
        return this.openList.data.length === 0;
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

    reconstructPath(node) {
        const path = [];
        while (node) {
            path.push(node.point); // Add to the end
            node = node.parent;
        }
        return path.reverse(); // Reverse the array once
    }


    heuristic(node, goal) { // Haversine heuristic
        const toRadians = (deg) => (deg * Math.PI) / 180;

        const [lat1, lon1] = [node.lat, node.lon];
        const [lat2, lon2] = [goal.lat, goal.lon];

        const R = 6371e3; // Radius of the Earth in kilometers
        const dLat = toRadians(lat2 - lat1);
        const dLon = toRadians(lon2 - lon1);
        const a =
            Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c; // Distance in kilometers
    }

    run() {
        let startNode = { point: this.start, parent: null, g: 0, f: this.heuristic(this.start, this.end) };
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
                const hScore = this.heuristic(neighbor, this.end);
                const fScore = gScore + hScore;

                const neighborNode = {
                    point: neighbor,
                    parent: currentNode,
                    g: gScore,
                    h: hScore,
                    f: fScore
                };

                if (!this.openMap.has(neighbor) || this.openMap.get(neighbor).f > fScore) {
                    this.openMap.set(neighbor, neighborNode);
                    this.openList.insert(neighborNode);
                }
            }
        }

        return null; // No path found
    }

    getNeighbors(point) {
        return this.graph.edges
            .filter(({ point1, point2, isCarAllowed }) => 
                isCarAllowed && (point1.id === point.id || point2.id === point.id)
            )
            .map(({ point1, point2 }) => (point1.id === point.id ? point2 : point1));
    }

    getDistance(point1, point2) {
        return this.distances.get(point1.id)?.get(point2.id) || Infinity;
    }

    createGraphWithOptimalPath() {
        const newGraph = { points: [], edges: [] };
        const pointSet = new Set();

        for (let i = 0; i < this.path.length - 1; i++) {
            const point1 = this.path[i];
            const point2 = this.path[i + 1];
            const distance = this.getDistance(point1, point2);
            newGraph.edges.push({ point1, point2, distance });
            pointSet.add(point1);
            pointSet.add(point2);
        }

        newGraph.points = Array.from(pointSet);
        console.log("Optimal path graph:", newGraph);
        return newGraph;
    }
}