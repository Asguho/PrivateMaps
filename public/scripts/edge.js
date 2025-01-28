export class Edge {
    constructor(point1, point2, type, maxSpeed, streetName) {
        this.point1 = point1;
        this.point2 = point2;
        this.type = type;
        this.isCarAllowed = this.isCarAllowedBasedOnType(type);
        this.maxSpeed = maxSpeed;
        this.color = this.getColorBasedOnType(type);
        this.streetName = streetName;
    }

    getColorBasedOnType(type) {
        // https://wiki.openstreetmap.org/wiki/Key:highway
        if(this.isCarAllowedBasedOnType(type)) {
            return 120;
        }
        return 200;
    }

    isCarAllowedBasedOnType(type) {
        if (type=="pedestrian" || 
            type=="footway" ||
            type== "path" || 
            type=="steps" || 
            type=="cycleway" || 
            type=="bus_guideway" || 
            type=="busway") {
            return false;
        }
        return true;
    }
            

    draw(ctx, viewport) {
        const { x: x1, y: y1 } = this.point1.toCanvasCoordinates(viewport);
        const { x: x2, y: y2 } = this.point2.toCanvasCoordinates(viewport);
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.strokeStyle = `hsl(${this.color}, 50%, 30%)`;
        ctx.lineWidth = 5;
        ctx.stroke();
    }
}