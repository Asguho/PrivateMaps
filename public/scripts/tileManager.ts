import { Graph } from "./graph.ts";
import { Point } from "./point.ts";
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

	async loadTileAsync(lat: number, lon: number, viewport: Viewport) {
		// Align lat and lon to the tile grid
		const alignedLat = Math.floor(lat / this.tileSize) * this.tileSize;
		const alignedLon = Math.floor(lon / this.tileSize) * this.tileSize;

		const tileKey = `${alignedLat},${alignedLon}`;
		// Check if tile is already loaded or being loaded using Map and Set
		if (this.tiles.has(tileKey) || this.loadingTiles.has(tileKey)) {
			return;
		}
		this.loadingTiles.add(tileKey);

		const tileLatStart = alignedLat;
		const tileLonStart = alignedLon;
		const tileLatEnd = alignedLat + this.tileSize;
		const tileLonEnd = alignedLon + this.tileSize;

		const tile = new Tile(tileLatStart, tileLonStart, tileLatEnd, tileLonEnd);
		await tile.loadTileAsync().then((graph) => {
			console.log("Tile loaded");
			//viewport.triggerRedraw();
		});
		this.loadingTiles.delete(tileKey);
		this.tiles.set(tileKey, tile);
	}

	determineTilesInView(viewport: Viewport) {
		// console.log('Determine tiles in view');
		const start = new Date().getTime();
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

		const end = new Date().getTime();
		// console.log(`Determine tiles in view = ${amountOfTilesProcessed}: ${end - start}ms`);
		return; // Removed unused 'tiles' variable
	}

	mergeGraph(graphs: Graph[]): Graph {
		const start = new Date().getTime();
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
		const end = new Date().getTime();
		console.log(`Merging graphs took ${end - start}ms`);
		return new Graph(points, edges, neighbors);
	}

	getAllTileGraphs() {
		const graphs = [];
		for (const tile of this.tiles.values()) {
			graphs.push(tile.getGraph());
		}
		return graphs;
	}

	async loadNearestTile(p: Point): Promise<Graph> {
		// Helper: Euclidean distance in degrees
		const distance = (lat1: number, lon1: number, lat2: number, lon2: number) => Math.hypot(lat2 - lat1, lon2 - lon1);

		// Create a local candidates array from this.unloadedTiles that are not loaded yet.
		const candidateTiles = this.unloadedTiles.filter((tile) => {
			const tileKey = `${tile.lat},${tile.lon}`;
			return !this.tiles.has(tileKey);
		});

		if (candidateTiles.length > 0) {
			// Find the candidate tile with center closest to p
			let nearest = candidateTiles[0];
			let minDist = distance(p.lat, p.lon, nearest.lat + this.tileSize / 2, nearest.lon + this.tileSize / 2);
			for (const tile of candidateTiles) {
				const d = distance(p.lat, p.lon, tile.lat + this.tileSize / 2, tile.lon + this.tileSize / 2);
				if (d < minDist) {
					minDist = d;
					nearest = tile;
				}
			}
			const tileKey = `${nearest.lat},${nearest.lon}`;
			if (!this.tiles.has(tileKey)) {
				await this.loadTileAsync(nearest.lat, nearest.lon, this.viewport);
			}
			return this.tiles.get(tileKey)?.getGraph() ?? new Graph();
		}

		// Fallback: align p to grid
		const alignedLat = Math.floor(p.lat / this.tileSize) * this.tileSize;
		const alignedLon = Math.floor(p.lon / this.tileSize) * this.tileSize;
		const tileKey = `${alignedLat},${alignedLon}`;
		if (!this.tiles.has(tileKey)) {
			await this.loadTileAsync(alignedLat, alignedLon, this.viewport);
		}
		return this.tiles.get(tileKey)?.getGraph() ?? new Graph();
	}
}
