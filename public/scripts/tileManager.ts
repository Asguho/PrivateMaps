import { Graph } from "./graph.ts";
import { Tile } from "./tile.ts";
import { Viewport } from "./viewport.ts";

export class TileManager {
	viewport: Viewport;
	unloadedTiles: { lat: number; lon: number }[];
	tiles: Map<string, Tile>;
	tileSize: number;
	private loadingTiles = new Set<string>();

	constructor(viewport: Viewport) {
		this.viewport = viewport;
		this.unloadedTiles = [];
		this.tiles = new Map();
		this.tileSize = 0.03;
	}

	draw(ctx: CanvasRenderingContext2D, viewport: Viewport) {
		const { minLat, maxLat, minLon, maxLon } = viewport.getGeoBounds();
		let amountOfTilesRendered = 0;
		for (const tile of this.tiles.values()) {
			if (
				tile.tileLatEnd >= minLat &&
				tile.tileLatStart <= maxLat &&
				tile.tileLonEnd >= minLon &&
				tile.tileLonStart <= maxLon
			) {
				amountOfTilesRendered++;
				tile.draw(ctx, viewport);
			}
		}
	}

	async loadTileAsync(
		lat: number,
		lon: number,
		viewport: Viewport,
	): Promise<Tile | null> {
		const alignedLat = Math.floor(lat / this.tileSize) * this.tileSize;
		const alignedLon = Math.floor(lon / this.tileSize) * this.tileSize;

		const tileKey = `${alignedLat},${alignedLon}`;
		if (this.tiles.has(tileKey)) {
			return this.tiles.get(tileKey) || null;
		}
		if (this.loadingTiles.has(tileKey)) {
			while (this.loadingTiles.has(tileKey)) {
				await new Promise((resolve) => setTimeout(resolve, 100));
			}
			return this.tiles.get(tileKey) || null;
		}
		this.loadingTiles.add(tileKey);

		const tileLatStart = alignedLat;
		const tileLonStart = alignedLon;
		const tileLatEnd = alignedLat + this.tileSize;
		const tileLonEnd = alignedLon + this.tileSize;

		const tile = new Tile(tileLatStart, tileLonStart, tileLatEnd, tileLonEnd);
		await tile.loadTileAsync().then((graph) => {
			this.tiles.set(tileKey, tile);
		});
		this.loadingTiles.delete(tileKey);
		return tile;
	}

	determineTilesInView(viewport: Viewport) {
		const { minLat, maxLat, minLon, maxLon } = viewport.getGeoBounds();

		const latStart = Math.floor(minLat / this.tileSize) * this.tileSize;
		const lonStart = Math.floor(minLon / this.tileSize) * this.tileSize;
		const latEnd = Math.ceil(maxLat / this.tileSize) * this.tileSize;
		const lonEnd = Math.ceil(maxLon / this.tileSize) * this.tileSize;

		for (let lat = latStart; lat < latEnd; lat += this.tileSize) {
			for (let lon = lonStart; lon < lonEnd; lon += this.tileSize) {
				this.unloadedTiles.push({ lat, lon });
			}
		}

		let amountOfTilesProcessed = 0;
		const promises = [];
		for (const tile of this.unloadedTiles) {
			const tileKey = `${tile.lat},${tile.lon}`;
			if (!this.tiles.has(tileKey)) {
				promises.push(this.loadTileAsync(tile.lat, tile.lon, viewport));
			}
			amountOfTilesProcessed++;
		}
		Promise.all(promises);
		this.unloadedTiles = [];
		return;
	}
	isTileLoaded(lat: number, lon: number) {
		const alignedLat = Math.floor(lat / this.tileSize) * this.tileSize;
		const alignedLon = Math.floor(lon / this.tileSize) * this.tileSize;
		return this.tiles.has(`${alignedLat},${alignedLon}`);
	}

	mergeGraph(graphs: Graph[]): Graph {
		const points = [];
		const edges = [];
		const neighbors = new Map();

		for (const graph of graphs) {
			points.push(...graph.points);
			edges.push(...graph.edges);
			for (const [pointId, neighborIds] of graph.neighbors) {
				if (neighbors.has(pointId)) {
					for (const neighborId of neighborIds) {
						if (!neighbors.get(pointId).includes(neighborId)) {
							neighbors.get(pointId).push(neighborId);
						}
					}
				} else {
					neighbors.set(pointId, neighborIds);
				}
			}
		}
		return new Graph(points, edges, neighbors);
	}

	getAllTileGraphs() {
		const graphs = [];
		for (const tile of this.tiles.values()) {
			graphs.push(tile.getGraph());
		}
		return graphs;
	}
}
