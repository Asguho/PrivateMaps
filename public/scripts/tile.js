import { OsmLoader } from "./osmLoader.js";


export class Tile {
  constructor(tileLatStart, tileLonStart, tileLatEnd, tileLonEnd) {
    this.tileLatStart = tileLatStart;
    this.tileLonStart = tileLonStart;
    this.tileLatEnd = tileLatEnd;
    this.tileLonEnd = tileLonEnd;
    this.loader = new OsmLoader();
    this.graph = null;
  }

  draw(ctx, viewport) {
    if (this.graph) {
      this.graph.draw(ctx, viewport);
    } else {
      const start = viewport.geoToCanvas(this.tileLatStart, this.tileLonStart);
      const end = viewport.geoToCanvas(this.tileLatEnd, this.tileLonEnd);
      ctx.strokeStyle = 'red';
      ctx.lineWidth = 5;
      ctx.strokeRect(start.x, start.y, end.x - start.x, end.y - start.y);
      ctx.fillStyle = 'red';
      ctx.font = '30px Arial';
      //place in the middle of the tile
      ctx.fillText('Loading...', (start.x + end.x) / 2, (start.y + end.y) / 2);
    }
  }

  async loadTileAsync() {
    this.graph = await this.loader.load(this.tileLatStart, this.tileLonStart, this.tileLatEnd, this.tileLonEnd);
    return { graph: this.graph };
  }
}