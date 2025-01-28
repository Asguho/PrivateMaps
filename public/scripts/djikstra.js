import { MinHeap } from './minheap.js';

export class DjikstraNode {
    constructor(state, parent, g) {
        this.state = state;
        this.parent = parent;
        this.g = g; // The distance from the start node
    }
}



export class Djikstra {
    constructor(graph, start, end) {
        this.graph = graph;
        this.start = start;
        this.end = end;
        this.openList = new MinHeap((a, b) => a.g - b.g); // MinHeap for efficiency
        this.openSet = new Map(); // Map to track elements in the open list (for fast look-up)
        this.closedList = new Set();
        this.path = [];
        this.distances = new Map();

        // Prepare distance matrix
        this.graph.edges.forEach(({ point1, point2, isCarAllowed }) => {
            if (!this.distances.has(point1.id)) this.distances.set(point1.id, new Map());
            if (!this.distances.has(point2.id)) this.distances.set(point2.id, new Map());
            const calculatedDistance = isCarAllowed ? this.haversineDistance(point1, point2) : Infinity;
            this.distances.get(point1.id).set(point2.id, calculatedDistance);
            this.distances.get(point2.id).set(point1.id, calculatedDistance);
            
        });
    }
    haversineDistance(lat1, lon1, lat2, lon2) {
        const R = 6371e3; // Earth radius in meters
        const toRadians = (degrees) => degrees * Math.PI / 180;
        const dLat = toRadians(lat2 - lat1);
        const dLon = toRadians(lon2 - lon1);
        const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                  Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) *
                  Math.sin(dLon / 2) * Math.sin(dLon / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    
        return R * c;
    }
    

    addOpen(node) {
        this.openList.insert(node);
        this.openSet.set(node.state.id, node); // Track node in Map for quick lookup
    }

    addClosed(node) {
        this.closedList.add(node.state.id);
    }

    isInClosed(state) {
        return this.closedList.has(state.id);
    }

    isInOpen(state) {
        return this.openSet.has(state.id);
    }

    reconstructPath(node) {
        const path = [];
        while (node) {
            path.push(node.state);
            node = node.parent;
        }
        return path.reverse();
    }

    getNeighbors(point) {
        return this.graph.edges
            .filter(({ point1, point2, isCarAllowed }) => 
                isCarAllowed && (point1.id === point.id || point2.id === point.id)
            )
            .map(({ point1, point2 }) => (point1.id === point.id ? point2 : point1));
    }
    

    getDistance(point1, point2) {
        return this.distances.get(point1.id)?.get(point2.id) ?? Infinity;
    }

    run() {
        const startNode = new DjikstraNode(this.start, null, 0);
        this.addOpen(startNode);

        while (!this.openList.isEmpty()) {
            const currentNode = this.openList.pop();

            // If we reach the destination, reconstruct the path
            if (currentNode.state.id === this.end.id) {
                this.path = this.reconstructPath(currentNode);
                return this.path; // Return the path as an array of points
            }

            // Mark current node as visited
            this.addClosed(currentNode);

            const neighbors = this.getNeighbors(currentNode.state);
            for (const neighbor of neighbors) {
                if (this.isInClosed(neighbor)) continue;

                const g = currentNode.g + this.getDistance(currentNode.state, neighbor);
                let neighborNode = new DjikstraNode(neighbor, currentNode, g);

                // If the neighbor is already in the open list, check if the new g is better
                if (this.isInOpen(neighborNode.state)) {
                    // Check if this new path to the neighbor is better (lower g value)
                    const existingNode = this.openSet.get(neighborNode.state.id);
                    if (existingNode && g < existingNode.g) {
                        // Update the g value and parent
                        existingNode.g = g;
                        existingNode.parent = currentNode;

                        // Since MinHeap doesn't support updating a node in place, we need to:
                        // 1. Remove the existing node from the heap
                        this.openList.data = this.openList.data.filter(node => node !== existingNode);
                        
                        // 2. Re-insert the updated node into the heap
                        this.openList.insert(existingNode);
                    }
                } else {
                    // If the neighbor isn't in the open list, add it
                    this.addOpen(neighborNode);
                }
            }
        }

        return null; // If no path found
    }

    createGraphWithOptimalPath() {
        const newGraph = { points: [], edges: [] };
        const pointSet = new Set();

        for (let i = 0; i < this.path.length - 1; i++) {
            const node1 = this.path[i];
            const node2 = this.path[i + 1];
            const distance = this.getDistance(node1, node2);
            newGraph.edges.push({ point1: node1, point2: node2, distance });
            pointSet.add(node1);
            pointSet.add(node2);
        }

        newGraph.points = Array.from(pointSet);
        console.log("Optimal path graph:", newGraph);
        return newGraph;
    }
}