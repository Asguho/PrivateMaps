import { type Point } from "./point.ts";
import { Viewport } from "./viewport.ts";

export class Path {
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

			const startCoords = viewport.geoToCanvas(
				this.points[0].lat,
				this.points[0].lon,
			);
			ctx.moveTo(startCoords.x, startCoords.y);
			for (let i = 1; i < this.points.length; i++) {
				const coords = viewport.geoToCanvas(this.points[i].lat, this.points[i].lon);
				ctx.lineTo(coords.x, coords.y);
			}
			ctx.stroke();
		}
	}
	size(): number {
		return this.points.length;
	}
	calculateTotalDistance() {
		var totalDistance = 0;
		for (let i = 0; i < this.points.length - 1; i++) {
			const point1 = this.points[i];
			const point2 = this.points[i + 1];
			const dist = this.distance(point1, point2) || null;
			totalDistance += dist ?? 0;
		}
		return totalDistance;
	}
	distance(node: Point, goal: Point) {
		const R = 6371e3;
		const [lat1, lon1] = [node.lat, node.lon];
		const [lat2, lon2] = [goal.lat, goal.lon];
		const toRadians = (degrees: number) => (degrees * Math.PI) / 180;
		const dLat = toRadians(lat2 - lat1);
		const dLon = toRadians(lon2 - lon1);
		const a =
			Math.sin(dLat / 2) * Math.sin(dLat / 2) +
			Math.cos(toRadians(lat1)) *
				Math.cos(toRadians(lat2)) *
				Math.sin(dLon / 2) *
				Math.sin(dLon / 2);
		const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
		return R * c;
	}
}
