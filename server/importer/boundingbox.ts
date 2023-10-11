export class BoundingBox {
    latitudeMax: number;
    latitudeMin: number;
    longitudeMax: number;
    longitudeMin: number;

    constructor(latitudeMax: number, latitudeMin: number, longitudeMax: number, longitudeMin) {
        this.latitudeMax = latitudeMax;
        this.latitudeMin = latitudeMin;
        this.longitudeMax = longitudeMax;
        this.longitudeMin = longitudeMin;
    }
}