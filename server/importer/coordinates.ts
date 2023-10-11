export class Coordinates {
	latitude: number;
	longitude: number;
	constructor(latitude: number, longitude: number) {
		this.latitude = latitude;
		this.longitude = longitude;
	}

	toString(): string {
		return this.latitude + "," + this.longitude;
	}
}