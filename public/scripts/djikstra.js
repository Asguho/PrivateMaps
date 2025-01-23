export class DjikstraNode {
    constructor(state, parent, g) {
        this.state = state;
        this.parent = parent;
        this.g = g;
    }
}

export class Djikstra {
    addOpen(node){
        this.openList.push(node);
        this.openList.sort((a, b) => a.f - b.f); //sorter efter mindste f value
    }
    //add node to closed list
    addClosed(node){
        this.closedList.push(node);
    }
    openListEmpty(){
        return this.openList.length == 0;
    }
    popOpen(){
        return this.openList.shift();
    }
    isInClosed(){
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

    constructor(graph) {
        this.graph = graph;
        this.openList = [];
        this.closedList = new Set();
        this.path = [];
    }
    run(start, end) { //ikke færdig, skal også lige kigges i gennem lige 
        //find nearby nodes of start
        let startNode = new DjikstraNode(start, null, 0);
        this.addOpen(startNode);
        while (this.openList.length > 0) {
            //find the node with the lowest f value
            let currentNode = this.popOpen();
            //add to closed list
            this.closedList.add(currentNode.state);
            //check if we are at the goal
            if (currentNode.state == end) {
                return this.reconstructPath(currentNode);
            }
            //find nearby nodes
            let neighbors = this.graph.getNeighbors(currentNode.state);
            for (let neighbor of neighbors) {
                //check if we have already visited this node
                if (this.closedList.has(neighbor)) {
                    continue;
                }
                //calculate g value
                let g = currentNode.g + this.graph.getEdgeWeight(currentNode.state, neighbor);
                //check if we have already visited this node
                let neighborNode = this.openList.find((node) => node.state == neighbor);
                if (neighborNode) {
                    if (g < neighborNode.g) {
                        neighborNode.g = g;
                        neighborNode.parent = currentNode;
                    }
                }
                else {
                    let newNode = new DjikstraNode(neighbor, currentNode, g);
                    this.addOpen(newNode);
                }
            }
        }

    }
}
