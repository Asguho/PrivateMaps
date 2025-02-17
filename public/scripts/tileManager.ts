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

	async loadTileAsync(lat: number, lon: number, _viewport: Viewport) {
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
		await tile.loadTileAsync().then((_graph) => {
			console.log("Tile loaded");
			//viewport.triggerRedraw();
		});
		this.loadingTiles.delete(tileKey);
		this.tiles.set(tileKey, tile);
	}

	determineTilesInView(viewport: Viewport) {
		// console.log('Determine tiles in view');
		const _start = new Date().getTime();
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

		const _end = new Date().getTime();
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

	async loadNearestTiles(p: Point, desparation: number): Promise<Graph> {
		const candidateTiles = [];
		let lat = p.lat;
		let lon = p.lon;
		let radius = 0;
		while (candidateTiles.length <= 1 + desparation / 5) {
			for (let i = -radius; i <= radius; i++) {
				for (let j = -radius; j <= radius; j++) {
					if (Math.abs(i) === radius || Math.abs(j) === radius) {
						const latCandidate = Math.floor(lat / this.tileSize) * this.tileSize + i * this.tileSize;
						const lonCandidate = Math.floor(lon / this.tileSize) * this.tileSize + j * this.tileSize;
						const tileKey = `${latCandidate},${lonCandidate}`;
						if (!this.tiles.has(tileKey)) {
							candidateTiles.push({ lat: latCandidate, lon: lonCandidate });
						}
					}
				}
			}
			console.log("Candidate tiles expand");
			radius += this.tileSize;
		}

		console.log("Candidate tiles:", candidateTiles);

		const loadPromises = candidateTiles.map((tile) => this.loadTileAsync(tile.lat, tile.lon, this.viewport));
		await Promise.all(loadPromises);

		// Merge with existing graphs
		const existingGraphs = this.getAllTileGraphs();

		return this.mergeGraph(existingGraphs.filter((graph) => graph !== null));
	}

	async ensureTileContainingPointIsLoaded(lat: number, lon: number): Promise<void> {
		const alignedLat = Math.floor(lat / this.tileSize) * this.tileSize;
		const alignedLon = Math.floor(lon / this.tileSize) * this.tileSize;
		const tileKey = `${alignedLat},${alignedLon}`;
		if (!this.tiles.has(tileKey)) {
			console.log("Tile not loaded, loading tile");
			await this.loadTileAsync(alignedLat, alignedLon, this.viewport);
		} else {
			console.log("Tile already loaded");
		}
		return;
	}

	async loadTilesInBoundingBox(lat1: number, lon1: number, lat2: number, lon2: number) {
		//not used af is too inefficient on large scale routes
		const minLat = Math.min(lat1, lat2);
		const maxLat = Math.max(lat1, lat2);
		const minLon = Math.min(lon1, lon2);
		const maxLon = Math.max(lon1, lon2);

		const latStart = Math.floor(minLat / this.tileSize) * this.tileSize;
		const lonStart = Math.floor(minLon / this.tileSize) * this.tileSize;
		const latEnd = Math.ceil(maxLat / this.tileSize) * this.tileSize;
		const lonEnd = Math.ceil(maxLon / this.tileSize) * this.tileSize;

		const promises = [];
		for (let lat = latStart; lat <= latEnd; lat += this.tileSize) {
			for (let lon = lonStart; lon <= lonEnd; lon += this.tileSize) {
				promises.push(this.loadTileAsync(lat, lon, this.viewport));
			}
		}

		await Promise.all(promises);
	}
}
