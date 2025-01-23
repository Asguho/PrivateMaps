export class Viewport {
    constructor(canvas) {
        this.canvas = canvas;
        this.offsetX = 0;
        this.offsetY = 0;
        this.scale = 1;
    }

    geoToCanvas(lat, lon) {
        const x = ((lon + 180) * (this.canvas.width / 360)) * this.scale + this.offsetX;
        const y = ((90 - lat) * (this.canvas.height / 180)) * this.scale + this.offsetY;
        return { x, y };
    }

    zoom(factor) {
        const oldScale = this.scale;
        //logarithmic zoom
        this.scale *= factor;
        const ratio = this.scale / oldScale;
        const centerX = this.canvas.width / 2;
        const centerY = this.canvas.height / 2;
        this.offsetX = centerX - ratio * (centerX - this.offsetX);
        this.offsetY = centerY - ratio * (centerY - this.offsetY);
    }

    pan(dx, dy) {
        this.offsetX += dx;
        this.offsetY += dy;
    }

    autoFit(latMin, latMax, lonMin, lonMax) {
        // Reset scale and offsets
        this.scale = 1;
        this.offsetX = 0;
        this.offsetY = 0;

        // Compute base coordinates without current scale/offset
        const baseX1 = (lonMin + 180) * (this.canvas.width / 360);
        const baseY1 = (90 - latMax) * (this.canvas.height / 180);
        const baseX2 = (lonMax + 180) * (this.canvas.width / 360);
        const baseY2 = (90 - latMin) * (this.canvas.height / 180);

        const dataWidth = Math.abs(baseX2 - baseX1);
        const dataHeight = Math.abs(baseY2 - baseY1);

        // Determine appropriate scale with a small margin (0.8)
        const scaleX = this.canvas.width / dataWidth;
        const scaleY = this.canvas.height / dataHeight;
        this.scale = 0.8 * Math.min(scaleX, scaleY);

        // Center the data in the canvas
        const midX = (baseX1 + baseX2) / 2;
        const midY = (baseY1 + baseY2) / 2;
        const canvasMidX = this.canvas.width / 2;
        const canvasMidY = this.canvas.height / 2;

        this.offsetX = canvasMidX - this.scale * midX;
        this.offsetY = canvasMidY - this.scale * midY;

        //log zoom and pan values
        console.log("Zoom: " + this.scale);
        console.log("Pan X: " + this.offsetX);
        console.log("Pan Y: " + this.offsetY);
    }
}