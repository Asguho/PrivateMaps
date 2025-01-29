export class Viewport {
    constructor(canvas) {
        this.canvas = canvas;
        this.offsetX = 0;
        this.offsetY = 0;
        this.scale = 1;
        this.baseWidth = 360;
        this.baseHeight = 180;
    }

    geoToCanvas(lat, lon) {
        const x = ((lon + 180) / 360) * this.baseWidth * this.scale + this.offsetX;
        const y = ((90 - lat) / 180) * this.baseHeight * this.scale + this.offsetY;
        return { x, y };
    }

    zoom(factor) {
        const oldScale = this.scale;
        //logarithmic zoom
        this.scale *= factor;
        this.scale = Math.max(6000, this.scale);
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

    center() {
        let center = { lat: 0, lon: 0 };
        center.lat = 90 - (this.offsetY - this.canvas.height / 2) / this.scale / this.baseHeight * 180;
        center.lon = (this.offsetX - this.canvas.width / 2) / this.scale / this.baseWidth * 360 - 180
        return center;
    }

    size() {
        return { width: this.canvas.width, height: this.canvas.height };
    }

    getGeoBounds() {
        const { width, height } = this.size();
        const topLeft = this.canvasToGeo(0, 0);
        const bottomRight = this.canvasToGeo(width, height);
        return { minLat: bottomRight.lat, maxLat: topLeft.lat, minLon: topLeft.lon, maxLon: bottomRight.lon };
    }

    canvasToGeo(x, y) {
        const lat = 90 - (y - this.offsetY) / this.scale / this.baseHeight * 180;
        const lon = (x - this.offsetX) / this.scale / this.baseWidth * 360 - 180;
        return { lat, lon };
    }

    triggerRedraw() {
        this.canvas.dispatchEvent(new CustomEvent('redraw'));
    }

    print() {
    }

    setScale(scale) {
        this.scale = scale;
    }

    setOffset(offsetX, offsetY) {
        this.offsetX = offsetX;
        this.offsetY = offsetY;
    }
}