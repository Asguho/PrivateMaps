export class Edge {
    constructor(point1, point2) {
        this.point1 = point1;
        this.point2 = point2;
    }
    draw(ctx, viewport) {
        const { x: x1, y: y1 } = this.point1.toCanvasCoordinates(viewport);
        const { x: x2, y: y2 } = this.point2.toCanvasCoordinates(viewport);
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.strokeStyle = 'black';
        ctx.lineWidth = 2;
        ctx.stroke();
    }
}