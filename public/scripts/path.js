export class path {
    constructor(points, colour){
        this.points = points;
        this.colour = colour;
    }
    draw(ctx, viewport) {
        if (this.points.length > 0) {
            ctx.strokeStyle = "red";
            ctx.lineWidth = 3;
            ctx.beginPath();
            const startCoords = this.points[0].point.toCanvasCoordinates(viewport);
            ctx.moveTo(startCoords.x, startCoords.y);
            for (let i = 1; i < this.points.length; i++) {
                const coords = this.points[i].point.toCanvasCoordinates(viewport);
                ctx.lineTo(coords.x, coords.y);
            }
            ctx.stroke();
        }
    }

}