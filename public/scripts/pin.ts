import { Viewport } from './viewport.ts';

export class Pin {
    id: number;
    lat: number;
    lon: number;
    shown: boolean = true;

    constructor(id: number, lat: number, lon: number, shown: boolean = true) {
        this.id = id;
        this.lat = lat;
        this.lon = lon;
        this.shown = shown;
    }

    toCanvasCoordinates(viewport: Viewport) {
        return viewport.geoToCanvas(this.lat, this.lon);
    }

    setLatLon(lat: number, lon: number) {
        this.shown = true;
        this.lat = lat;
        this.lon = lon;
    }

    draw(ctx: CanvasRenderingContext2D, viewport: Viewport) {
        if (!this.shown) {
            return;
        }

        const { x, y } = this.toCanvasCoordinates(viewport);

        // Set font and alignment for drawing the pin emoji.
        ctx.font = '24px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        // Draw the pin id above the emoji.
        ctx.fillText(this.id.toString(), x, y - 20);

        // Draw the pushpin emoji at the computed coordinates.
        ctx.fillText('📍', x, y);
    }

    equals(other: Pin): boolean {
        return this.id === other.id && this.lat === other.lat &&
            this.lon === other.lon;
    }
}
