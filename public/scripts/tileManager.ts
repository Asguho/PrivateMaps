import { Tile } from "./tile.ts";
import { Viewport } from "./viewport.ts";


export class TileManager {
    viewport: Viewport;
    unloadedTiles: { lat: number; lon: number }[];
    tiles: Map<string, Tile>;
    tileSize: number;

    constructor(viewport: Viewport) {
        this.viewport = viewport;
        this.unloadedTiles = [];
        // Use a Map for faster tile lookups
        this.tiles = new Map();
        this.tileSize = 0.03;
    }

    draw(ctx: HTMLCanvasElement, viewport: Viewport) {
        const { minLat, maxLat, minLon, maxLon } = viewport.getGeoBounds();
        let amountOfTilesRendered = 0;
        // Iterate over Map values
        for (let tile of this.tiles.values()) {
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

        console.log(`Amount of tiles rendered: ${amountOfTilesRendered}`);
    }

    async loadTileAsync(lat: number, lon: number, viewport: Viewport) {
        // Align lat and lon to the tile grid
        const alignedLat = Math.floor(lat / this.tileSize) * this.tileSize;
        const alignedLon = Math.floor(lon / this.tileSize) * this.tileSize;

        const tileKey = `${alignedLat},${alignedLon}`;
        // Check if tile is already loaded using Map
        if (this.tiles.has(tileKey)) {
            return;
        }

        const tileLatStart = alignedLat;
        const tileLonStart = alignedLon;
        const tileLatEnd = alignedLat + this.tileSize;
        const tileLonEnd = alignedLon + this.tileSize;

        const tile = new Tile(tileLatStart, tileLonStart, tileLatEnd, tileLonEnd);
        tile.loadTileAsync().then((graph) => {
            console.log('Tile loaded', graph);
            viewport.triggerRedraw();
        });
        this.tiles.set(tileKey, tile);
    }

    determineTilesInView(viewport: Viewport) {
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
        for (let tile of this.unloadedTiles) {
            const tileKey = `${tile.lat},${tile.lon}`;
            if (!this.tiles.has(tileKey)) {
                this.loadTileAsync(tile.lat, tile.lon, viewport);
            }
            amountOfTilesProcessed++;
        }
        this.unloadedTiles = [];

        const end = new Date().getTime();
        console.log(`Determine tiles in view = ${amountOfTilesProcessed}: ${end - start}ms`);
        return; // Removed unused 'tiles' variable
    }
}