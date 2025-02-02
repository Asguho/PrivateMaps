import { Viewport } from './viewport.ts';

export class Point {
    id: number;
    lat: number;
    lon: number;

    constructor(id: number, lat: number, lon: number) {
        this.id = id;
        this.lat = lat;
        this.lon = lon;
    }
}
