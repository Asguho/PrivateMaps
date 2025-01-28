export class Point {
    constructor(id, lat, lon) {
        this.id = id;
        this.lat = lat;
        this.lon = lon;
    }

    toCanvasCoordinates(viewport) {
        return viewport.geoToCanvas(this.lat, this.lon);
    }

    draw(ctx, viewport) {
        const { x, y } = this.toCanvasCoordinates(viewport);
        ctx.beginPath();
        ctx.arc(x, y, 3, 0, 2 * Math.PI);
        ctx.fillStyle = 'black';
        ctx.fill();
    }
}