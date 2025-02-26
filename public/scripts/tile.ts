import { OsmLoader } from "./osmLoader.ts";
import { Graph } from "./graph.ts";
import { Viewport } from "./viewport.ts";

export class Tile {
	tileLatStart: number;
	tileLonStart: number;
	tileLatEnd: number;
	tileLonEnd: number;
	loader: OsmLoader;
	graph: Graph | null;

	constructor(
		tileLatStart: number,
		tileLonStart: number,
		tileLatEnd: number,
		tileLonEnd: number,
	) {
		this.tileLatStart = tileLatStart;
		this.tileLonStart = tileLonStart;
		this.tileLatEnd = tileLatEnd;
		this.tileLonEnd = tileLonEnd;
		this.loader = new OsmLoader();
		this.graph = null;
	}

	draw(ctx: CanvasRenderingContext2D, viewport: Viewport) {
		if (this.graph) {
			this.graph.draw(ctx, viewport);
		} else {
			const start = viewport.geoToCanvas(this.tileLatStart, this.tileLonStart);
			const end = viewport.geoToCanvas(this.tileLatEnd, this.tileLonEnd);
			ctx.fillStyle = "red";
			ctx.font = "30px Arial";
			ctx.fillText("Loading...", (start.x + end.x) / 2, (start.y + end.y) / 2);
			ctx.strokeStyle = "red";
			ctx.lineWidth = 5;
			ctx.strokeRect(start.x, start.y, end.x - start.x, end.y - start.y);
		}
	}

	async loadTileAsync() {
		this.graph = await this.loader.load(
			this.tileLatStart,
			this.tileLonStart,
			this.tileLatEnd,
			this.tileLonEnd,
		);
		return { graph: this.graph };
	}

	getGraph(): Graph | null {
		if (!this.graph) {
			return null;
		}
		return this.graph;
	}
}
