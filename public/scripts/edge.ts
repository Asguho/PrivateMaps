import { Point } from "./point.ts";
import { Viewport } from "./viewport.ts";

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

	constructor(
		point1: Point,
		point2: Point,
		type: string,
		maxSpeed: number,
		streetName: string,
		oneway: boolean,
		junction: boolean
	) {
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

	getColorBasedOnType(type: string) {
		// https://wiki.openstreetmap.org/wiki/Key:highway
		if (this.isCarAllowedBasedOnType(type)) {
			return 120;
		}
		return 200;
	}

	isCarAllowedBasedOnType(type: string) {
		if (
			type === "pedestrian" ||
			type === "footway" ||
			type === "path" ||
			type === "steps" ||
			type === "cycleway" ||
			type === "bus_guideway" ||
			type === "busway"
		) {
			return false;
		}
		return true;
	}

	/**
	 * Returns a minimum viewport.scale (zoom level) required to render a road based on its type.
	 *
	 * The values below are chosen so that major roads like motorways and trunks are rendered
	 * even when zoomed out, while smaller roads like residential or service roads only show up when zoomed in.
	 */
	getMinZoomBasedOnType(type: string) {
		const zoomLevels: { [key: string]: number } = {
			motorway: 0,
			trunk: 0,
			primary: 2000,
			secondary: 4000,
			tertiary: 6000,
			residential: 8000,
			unclassified: 10000,
			service: 12000,
			// For pedestrian and similar paths, we show them only at high zoom levels
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
	 * Adjusts both the rendering based on the zoom level (LOD) and the line width for visual clarity.
	 */
	draw(ctx: CanvasRenderingContext2D, viewport: Viewport) {
		// Check if we should render this road at the current zoom level.
		const minZoom = this.getMinZoomBasedOnType(this.type);
		if (viewport.scale < minZoom) return;

		// Convert geographical coordinates to canvas coordinates.
		const { x: x1, y: y1 } = this.point1.toCanvasCoordinates(viewport);
		const { x: x2, y: y2 } = this.point2.toCanvasCoordinates(viewport);

		ctx.beginPath();
		ctx.moveTo(x1, y1);
		ctx.lineTo(x2, y2);
		ctx.strokeStyle = `hsl(${this.color}, 50%, 30%)`;

		// Adjust line width based on zoom level.
		// This example uses a simple proportional mapping:
		// - When viewport.scale is 30000 (fully zoomed in), the line width will be 5.
		// - When viewport.scale is lower, the line width scales down, but never below 1.
		const maxZoom = 30000;
		const baseLineWidth = 5;
		const normalizedZoom = viewport.scale / maxZoom;
		const lineWidth = Math.max(1, normalizedZoom * baseLineWidth);

		ctx.lineWidth = lineWidth;
		ctx.stroke();
	}
}
