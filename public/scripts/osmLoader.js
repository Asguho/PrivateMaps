import { Point } from "./point.js";
import { Edge } from "./edge.js";
import { Graph } from "./graph.js";

export class OsmLoader {
  constructor() {
    this.points = [];
    this.edges = [];
  }

  async load() {
    const result = await fetch(
      "https://overpass-api.de/api/interpreter",
      {
        method: "POST",
        // The body contains the query
        // to understand the query language see "The Programmatic Query Language" on
        // https://wiki.openstreetmap.org/wiki/Overpass_API#The_Programmatic_Query_Language_(OverpassQL)
        body: "data=" + encodeURIComponent(`
[out:json][timeout:25];
// gather results
(
  way["highway"](55.729562,12.490795,55.746360,12.515606);
);
// print results
out geom;
        `)
      },
    ).then(
      (data) => data.json()
    )
    console.log(JSON.stringify(result, null, 2))

    // Create points
    for (const element of result.elements) {
      if (element.type === "node") {
        this.points.push(new Point(element.id, element.lat, element.lon));
      }
    }

    // Create points for nodes in ways
    for (const element of result.elements) {
      if (element.type === "way") {
        for (let i = 0; i < element.geometry.length; i++) {
          const node = element.geometry[i];
          if (!this.points.find(point => point.id === element.nodes[i])) {
            this.points.push(new Point(element.nodes[i], node.lat, node.lon));
          }
        }
      }
    }

    // Create edges
    for (const element of result.elements) {
      if (element.type === "way") {
        for (let i = 0; i < element.nodes.length - 1; i++) {
          const from = this.points.find(point => point.id === element.nodes[i]);
          const to = this.points.find(point => point.id === element.nodes[i + 1]);
          this.edges.push(new Edge(from, to, element.tags.highway, element.tags.maxspeed));
        }
      }
    }

    console.log(this.points, this.edges);

    return new Graph(this.points, this.edges);
  }
}