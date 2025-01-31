import { Point } from './point.ts';
import { Viewport } from './viewport.ts';

export class Edge {
  point1: Point;
  point2: Point;
  type: string;
  isCarAllowed: boolean;
  maxSpeed: number;
  color: number;
  streetName: string;
  oneway: boolean;
  junction: boolean;
  
  constructor(point1: Point, point2: Point, type: string, maxSpeed: number, streetName: string, oneway: boolean, junction: boolean) {
    this.point1 = point1;
    this.point2 = point2;
    this.type = type;
    this.isCarAllowed = this.isCarAllowedBasedOnType(type);
    this.maxSpeed = maxSpeed;
    this.color = this.getColorBasedOnType(type);
    this.streetName = streetName;
    this.oneway = oneway;
    this.junction = junction;

  }

  getColorBasedOnType(type: string) {
    // https://wiki.openstreetmap.org/wiki/Key:highway
    if (this.isCarAllowedBasedOnType(type)) {
      return 120;
    }
    return 200;
  }

  isCarAllowedBasedOnType(type: string) {
    if (
      type == 'pedestrian' ||
      type == 'footway' ||
      type == 'path' ||
      type == 'steps' ||
      type == 'cycleway' ||
      type == 'bus_guideway' ||
      type == 'busway'
    ) {
      return false;
    }
    return true;
  }

  draw(ctx: CanvasRenderingContext2D, viewport: Viewport) {
    const { x: x1, y: y1 } = this.point1.toCanvasCoordinates(viewport);
    const { x: x2, y: y2 } = this.point2.toCanvasCoordinates(viewport);
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.strokeStyle = `hsl(${this.color}, 50%, 30%)`;
    ctx.lineWidth = 5;
    ctx.stroke();
  }
}
