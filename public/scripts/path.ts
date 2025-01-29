import { type Point } from './point.ts';
import { Viewport } from './viewport.ts';

export class path {
  points: Point[];
  colour: string;

  constructor(points: Point[], colour: string) {
    this.points = points;
    this.colour = colour;
  }

  draw(ctx: CanvasRenderingContext2D, viewport: Viewport) {
    if (this.points && this.points.length > 0) {
      ctx.strokeStyle = this.colour;
      ctx.lineWidth = 3;
      ctx.beginPath();

      const startCoords = this.points[0].toCanvasCoordinates(viewport);
      ctx.moveTo(startCoords.x, startCoords.y);
      for (let i = 1; i < this.points.length; i++) {
        const coords = this.points[i].toCanvasCoordinates(viewport);
        ctx.lineTo(coords.x, coords.y);
      }
      ctx.stroke();
    }
  }
}
