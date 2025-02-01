import { Point } from './point.ts';
import { Viewport } from './viewport.ts';

export class Edge {
  point1: Point;
  point2: Point;
  type: string;
  isCarAllowed: boolean;
  maxSpeed: number;
  color: string;
  streetName: string;
  oneway: boolean;
  junction: boolean;

  constructor(point1: Point, point2: Point, type: string, maxSpeed: number, streetName: string, oneway: boolean, junction: boolean) {
    this.point1 = point1;
    this.point2 = point2;
    this.type = type;
    this.isCarAllowed = this.isCarAllowedBasedOnType(type);
    this.maxSpeed = maxSpeed ?? 50;
    this.color = this.getColorBasedOnType(type);
    this.streetName = streetName;
    this.oneway = oneway;
    this.junction = junction;
  }

  /**
   * Returns a hex color string for the given road type, using a Google-inspired palette.
   * Note: The lightest roads now use a light gray (#d3d3d3) so they remain visible on a white background.
   */
  getColorBasedOnType(type: string): string {
    const roadColors: { [key: string]: string } = {
      // Major roads
      motorway: '#e7711b', // Bold, dark orange
      trunk: '#e7711b', // Bold, dark orange
      primary: '#ffcc00', // Bright yellow/orange
      // Intermediate roads
      secondary: '#ffe699', // Soft yellow
      tertiary: '#ffd966', // Slightly darker soft yellow
      // Minor roads - using light gray so they contrast on a white background
      residential: '#d3d3d3',
      unclassified: '#d3d3d3',
      service: '#d3d3d3',
      // Non-car paths and pedestrian zones - a slightly darker gray for better differentiation
      pedestrian: '#c0c0c0',
      footway: '#c0c0c0',
      cycleway: '#c0c0c0',
      path: '#c0c0c0',
      steps: '#c0c0c0',
    };

    // Return the mapped color, defaulting to light gray if the type is not found.
    return roadColors[type] ?? '#d3d3d3';
  }

  /**
   * Determines if a given road type allows cars.
   */
  isCarAllowedBasedOnType(type: string): boolean {
    if (
      type === 'pedestrian' ||
      type === 'footway' ||
      type === 'path' ||
      type === 'steps' ||
      type === 'cycleway' ||
      type === 'bus_guideway' ||
      type === 'busway'
    ) {
      return false;
    }
    return true;
  }

  /**
   * Returns the minimum viewport.scale (zoom level) required to render a road based on its type.
   * Major roads appear at lower zoom levels, while minor roads only show up when zoomed in.
   */
  getMinZoomBasedOnType(type: string): number {
    const zoomLevels: { [key: string]: number } = {
      motorway: 0,
      trunk: 0,
      primary: 2000,
      secondary: 4000,
      tertiary: 6000,
      residential: 8000,
      unclassified: 10000,
      service: 12000,
      pedestrian: 14000,
      footway: 14000,
      cycleway: 14000,
      path: 14000,
      steps: 14000,
    };

    return zoomLevels[type] ?? 12000;
  }

  /**
   * Draws the road edge onto the canvas using the provided viewport.
   * The method adjusts both the level-of-detail (LOD) and the line width based on the zoom level.
   */
  draw(ctx: CanvasRenderingContext2D, viewport: Viewport): void {
    // Check if we should render this road at the current zoom level.
    const minZoom = this.getMinZoomBasedOnType(this.type);
    if (viewport.scale < minZoom) return;

    // Convert geographical coordinates to canvas coordinates.

    const { x: x1, y: y1 } = viewport.geoToCanvas(this.point1.lat, this.point1.lon);
    const { x: x2, y: y2 } = viewport.geoToCanvas(this.point2.lat, this.point2.lon);

    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.strokeStyle = this.color;

    // Adjust line width based on zoom level:
    // When fully zoomed in (viewport.scale ~ 30000), the road is drawn with a thicker line.
    const maxZoom = 30000;
    const baseLineWidth = 5;
    const normalizedZoom = viewport.scale / maxZoom;
    const lineWidth = Math.max(1, normalizedZoom * baseLineWidth);
    ctx.lineWidth = lineWidth;

    ctx.stroke();
  }
}
