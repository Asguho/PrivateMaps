import { Point } from './point.ts';
import { Edge } from './edge.ts';
import { Graph } from './graph.ts';

export class OsmLoader {
  points: Point[];
  edges: Edge[];
  constructor() {
    this.points = [];
    this.edges = [];
  }

  async load(latStart: number, lonStart: number, latEnd: number, lonEnd: number) {
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
  way["highway"](${latStart},${lonStart},${latEnd},${lonEnd});
);
// print results
out geom;
        `)
      },
    ).then(
      (data) => data.json()
    )

    // Create points
    for (const element of result.elements) {
      if (element.type === "node") {
        this.points.push(new Point(element.id, element.lat, element.lon));
      }
    }

    // Create points for nodes in ways
    for (const element of result.elements) {
      if (element.type === 'way') {
        for (let i = 0; i < element.geometry.length; i++) {
          const node = element.geometry[i];
          if (!this.points.find((point) => point.id === element.nodes[i])) {
            this.points.push(new Point(element.nodes[i], node.lat, node.lon));
          }
        }
      }
    }

    // Create edges
    for (const element of result.elements) {
      if (element.type === 'way') {
        for (let i = 0; i < element.nodes.length - 1; i++) {
          const from = this.points.find((point) => point.id === element.nodes[i]);
          const to = this.points.find((point) => point.id === element.nodes[i + 1]);
          if (!from || !to) {
            console.log('Missing point');
            continue;
          }
          this.edges.push(new Edge(from, to, element.tags.highway, element.tags.maxspeed, element.tags.name, (element.tags.oneway === "yes"), (element.tags.junction === "roundabout")));
        }
      }
    }

    console.log(this.points, this.edges);

    return new Graph(this.points, this.edges);
  }
}
