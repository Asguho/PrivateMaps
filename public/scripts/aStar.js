export class aStar {
  constructor(graph, start, end) {
      this.graph = graph;
      this.start = start;
      this.end = end;
      this.openList = [];
      this.closedList = new Set();
      this.path = [];
      this.openMap = new Map(); 
      //vi udregner lige distancer først
      this.distances = new Map();
      this.graph.edges.forEach(edge => {
        const { point1, point2, distance } = edge;
        if (!this.distances.has(point1)) this.distances.set(point1, new Map());
        if (!this.distances.has(point2)) this.distances.set(point2, new Map());
        this.distances.get(point1).set(point2, distance);
        this.distances.get(point2).set(point1, distance);
    });

  }

  addOpen(node) {
      this.openList.push(node);
      this.openList.sort((a, b) => a.f - b.f); // Sort by smallest f value - evt. optimer med heap
  }

 

  openListEmpty() {
      return this.openList.length === 0;
  }

  popOpen() {
      return this.openList.shift();
  }

/*
  addClosed(node) {
    this.closedList.add(node);
  }

  isInClosed(node) {
      return this.closedList.has(node);
  }
*/

  addClosed(node) {
    this.closedList.add(node.point);
  }

  isInClosed(point) {
      return this.closedList.has(point);
  }
  /*
  reconstructPath(node) {
      const path = [];
      while (node) {
          path.unshift(node); // Add node to the path
          node = node.parent; // Move to the parent node
      }
      return path;
  }
  */
  reconstructPath(node) {
    const path = [];
    while (node) {
        path.push(node); // Add to the end
        node = node.parent;
    }
    return path.reverse(); // Reverse the array once
  }



  heuristic(node, goal) { // Haversine heuristic
      const toRadians = (deg) => (deg * Math.PI) / 180;

      const [lat1, lon1] = [node.lat, node.lon];
      const [lat2, lon2] = [goal.lat, goal.lon];

      const R = 6371; // Radius of the Earth in kilometers
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
      this.addOpen(startNode);

      while (!this.openListEmpty()) {


          const currentNode = this.popOpen();
          if (currentNode.point === this.end) {
              this.path = this.reconstructPath(currentNode);
              console.log("Path found");
              return this.path;
          }

          this.addClosed(currentNode);

          const neighbors = this.getNeighbors(currentNode.point);
          for (const neighbor of neighbors) {
              if (this.isInClosed(neighbor.point)) continue;

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
              /*
              if (!this.openList.some(node => node.point === neighbor && node.f <= fScore)) {
                  this.addOpen(neighborNode);
              }
              */
              if (!this.openMap.has(neighbor) || this.openMap.get(neighbor).f > fScore) {
                this.openMap.set(neighbor, neighborNode);
                this.addOpen(neighborNode);
            }
            
          }

      }

      console.log("No path found");
      return null; // No path found
  }

  getNeighbors(point) {
    return this.graph.edges
        .filter(edge => edge.point1 === point || edge.point2 === point)
        .map(edge => edge.point1 === point ? edge.point2 : edge.point1);
}

  /*
  getDistance(point1, point2) {
      let edge = this.graph.edges.find(edge => (edge[0] === point1 && edge[1] === point2) || (edge[0] === point2 && edge[1] === point1));
      return edge ? edge[2] : Infinity;
  }
  */
  getDistance(point1, point2) {
    return this.distances.get(point1)?.get(point2) || Infinity;
  }


  createGraphWithOptimalPath() {
      let newGraph = { points: this.graph.points, edges: [] };
      for (let i = 0; i < this.path.length - 1; i++) {
          let point1 = this.path[i];
          let point2 = this.path[i + 1];
          let distance = this.getDistance(point1, point2);
          newGraph.edges.push([point1, point2, distance]);
      }
      return newGraph;
  }
}