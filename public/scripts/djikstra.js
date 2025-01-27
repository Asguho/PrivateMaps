export class DjikstraNode {
    constructor(state, parent, g) {
        this.state = state;
        this.parent = parent;
        this.g = g;
    }
}

export class Djikstra {
    constructor(graph, start, end) {
        this.graph = graph;
        this.start = start;
        this.end = end;
        this.openList = [];
        this.closedList = new Set();
        this.path = [];
    }

    addOpen(node) {
        this.openList.push(node);
        this.openList.sort((a, b) => a.g - b.g); // Sort by smallest g value
    }

    addClosed(node) {
        this.closedList.add(node);
    }

    openListEmpty() {
        return this.openList.length === 0;
    }

    popOpen() {
        return this.openList.shift();
    }

    isInClosed(node) {
        return this.closedList.has(node);
    }

    reconstructPath(node) {
        const path = [];
        while (node) {
            path.unshift(node.state); // Add node state to the path
            node = node.parent; // Move to the parent node
        }
        return path;
    }

    run() {
        let startNode = new DjikstraNode(this.start, null, 0);
        this.addOpen(startNode);

        while (!this.openListEmpty()) {
            let currentNode = this.popOpen();

            if (currentNode.state === this.end) {
                this.path = this.reconstructPath(currentNode);
                return this.createGraphWithOptimalPath();
            }

            this.addClosed(currentNode);

            let neighbors = this.getNeighbors(currentNode.state);
            for (let neighbor of neighbors) {
                if (this.isInClosed(neighbor)) continue;

                let g = currentNode.g + this.getDistance(currentNode.state, neighbor);
                let neighborNode = new DjikstraNode(neighbor, currentNode, g);

                this.addOpen(neighborNode);
            }
        }

        return null; // No path found
    }

    getNeighbors(node) {
        return this.graph.edges
            .filter(edge => edge[0] === node)
            .map(edge => edge[1]);
    }

    getDistance(node1, node2) {
        let edge = this.graph.edges.find(edge => (edge[0] === node1 && edge[1] === node2) || (edge[0] === node2 && edge[1] === node1));
        return edge ? edge[2] : Infinity;
    }

    createGraphWithOptimalPath() {
        let newGraph = { points: this.graph.points, edges: [] };
        for (let i = 0; i < this.path.length - 1; i++) {
            let node1 = this.path[i];
            let node2 = this.path[i + 1];
            let distance = this.getDistance(node1, node2);
            newGraph.edges.push([node1, node2, distance]);
        }
        return newGraph;
    }
}