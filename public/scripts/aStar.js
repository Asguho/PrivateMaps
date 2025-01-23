export class aStar{
    constructor(){
        this.openList = [];
        this.closedList = new Set();
        this.path = [];
    }
    //add node to open list
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
    



    heuristic(node, goal) { //haversine heuristic
        const toRadians = (deg) => (deg * Math.PI) / 180;
      
        const [lat1, lon1] = node.coordinates;
        const [lat2, lon2] = goal.coordinates;
      
        const R = 6371; // Radius of the Earth in kilometers
        const dLat = toRadians(lat2 - lat1);
        const dLon = toRadians(lon2 - lon1);
      
        const a =
          Math.sin(dLat / 2) ** 2 +
          Math.cos(toRadians(lat1)) *
            Math.cos(toRadians(lat2)) *
            Math.sin(dLon / 2) ** 2;
      
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c; // Distance in kilometers
      }
      

    run(start, end){ //ikke færdig, skal også lige kigges i gennem lige 
        const start = new Node("Start");
        const goal = new Node("Goal");

        start.g = 0; // Cost to reach the start node is 0
        start.h = heuristic(start, goal); // Compute the heuristic estimate to the goal
        start.f = start.g + start.h; // Total cost
        this.addOpen(start);


        while (!this.openListEmpty()){
            const current = this.popOpen();
            if (current.state === goal.state){
                return this.reconstructPath(current);
            }
            this.addClosed(current);
            for (const { node: neighbor, cost } of current.neighbors) {
                if (this.isInClosed(neighbor)) continue; // Skip if already in closed list
        
                const tentativeG = current.g + cost; // Calculate tentative g-value
        
                // If the neighbor is not in the open list or the new g-value is better
                if (!this.openList.includes(neighbor) || tentativeG < neighbor.g) {
                  neighbor.g = tentativeG; // Update g-value
                  neighbor.h = this.heuristic(neighbor, goal); // Update h-value
                  neighbor.f = neighbor.g + neighbor.h; // Update f-value
                  neighbor.parent = current; // Set parent for path reconstruction
        
                  if (!this.openList.includes(neighbor)) {
                    this.addOpen(neighbor); // Add neighbor to open list
                  }
                }
              }
        }
        
            // If the open list is empty and goal was not reached, return null
        return null;
    }
}


    

