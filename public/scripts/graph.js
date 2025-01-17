export class Graph {
    constructor(points = [], edges = []) {
        this.points = points;
        this.edges = edges;
    }
    addPoint(point) {
        this.points.push(point);
    }
    addEdge(edge) {
        this.edges.push(edge);
    }
    draw(ctx) {
        this.edges.forEach(edge => edge.draw(ctx));
        this.points.forEach(point => point.draw(ctx));
    }
}