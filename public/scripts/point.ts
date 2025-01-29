import { Viewport } from './viewport.ts';

export class Point {
  id: number;
  lat: number;
  lon: number;

  constructor(id: number, lat: number, lon: number) {
    this.id = id;
    this.lat = lat;
    this.lon = lon;
  }

  toCanvasCoordinates(viewport: Viewport) {
    return viewport.geoToCanvas(this.lat, this.lon);
  }

  draw(ctx: CanvasRenderingContext2D, viewport: Viewport) {
    const { x, y } = this.toCanvasCoordinates(viewport);
    ctx.beginPath();
    ctx.arc(x, y, 3, 0, 2 * Math.PI);
    ctx.fillStyle = 'black';
    ctx.fill();
  }
  equals(other: Point): boolean {
    return this.id === other.id && this.lat === other.lat && this.lon === other.lon;
  }
}
