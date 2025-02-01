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
      //"https://overpass-api.de/api/interpreter",
      'http://localhost:8000/api',
      {
        method: 'POST',
        // The body contains the query
        // to understand the query language see "The Programmatic Query Language" on
        // https://wiki.openstreetmap.org/wiki/Overpass_API#The_Programmatic_Query_Language_(OverpassQL)
        cache: 'force-cache',
        body:
          'data=' +
          encodeURIComponent(`
[out:json][timeout:25];
// gather results
(
  way["highway"](${latStart},${lonStart},${latEnd},${lonEnd});
);
// print results
out geom;
        `),
      }
    ).then((data) => data.json());
    const startTime = performance.now();
    // Create points
    const pointStartTimes = performance.now();
    for (const element of result.elements) {
      if (element.type === 'node') {
        this.points.push(new Point(element.id, element.lat, element.lon));
      }
    }
    const pointEndTimes = performance.now();
    console.log(`Creating points took ${pointEndTimes - pointStartTimes}ms`);

    const edgeStartTimes = performance.now();
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
    const edgeEndTimes = performance.now();
    console.log(`Creating points for nodes in ways took ${edgeEndTimes - edgeStartTimes}ms`);

    const edgeStartTimes2 = performance.now();
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
          this.edges.push(
            new Edge(
              from,
              to,
              element.tags.highway,
              element.tags.maxspeed,
              element.tags.name,
              element.tags.oneway === 'yes',
              element.tags.junction === 'roundabout'
            )
          );
        }
      }
    }
    const edgeEndTimes2 = performance.now();
    console.log(`Creating edges took ${edgeEndTimes2 - edgeStartTimes2}ms`);

    const endTime = performance.now();
    console.log(`Loading took ${endTime - startTime}ms`);
    return new Graph(this.points, this.edges);
  }
}
