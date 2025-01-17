export class Edge {
    constructor(point1, point2) {
        this.point1 = point1;
        this.point2 = point2;
    }
    draw(ctx) {
        ctx.beginPath();
        ctx.moveTo(this.point1.x, this.point1.y);
        ctx.lineTo(this.point2.x, this.point2.y);
        ctx.strokeStyle = 'black';
        ctx.lineWidth = 2;
        ctx.stroke();
    }
}