export class Node {
    constructor(state) {
      this.state = state;       // Unique identifier for the node (e.g., position or value)
      this.g = Infinity;        // Cost from the start node to this node (initialized to Infinity)
      this.h = 0;               // Heuristic estimate to the goal (initialized to 0)
      this.f = Infinity;        // Total cost (f = g + h)
      this.parent = null;       // Reference to the parent node for path reconstruction
      this.neighbors = [];      // List of neighboring nodes
    }
  
    // Method to add a neighbor (if implementing neighbors dynamically)
    addNeighbor(node) {
        this.neighbors.push({ node: neighbor, cost });
    }
  }
  