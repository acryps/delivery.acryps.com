import { Rectangle } from "./rectangle";

export class Point {
	static readonly earthRadius = 6378137;

	constructor(
		public latitude: number,
		public longitude: number
	) {}

	static from(points) {
		return new Point(points.latitude, points.longitude);
	}

	walk(angle: number, distance: number) {
		if (angle === null) {
			return new Point(this.latitude, this.longitude);
		}
		
		// Convert latitude and longitude from degrees to radians
		const latitudeRadians = (this.latitude * Math.PI) / 180;
		const longitudeRadians = (this.longitude * Math.PI) / 180;

		// Calculate the new latitude
		const movedLatitudeRadians = Math.asin(Math.sin(latitudeRadians) * Math.cos(distance / Point.earthRadius) + Math.cos(latitudeRadians) * Math.sin(distance / Point.earthRadius) * Math.cos(angle));

		// Calculate the new longitude
		const movedLongitudeRadians = longitudeRadians + Math.atan2(Math.sin(angle) * Math.sin(distance / Point.earthRadius) * Math.cos(latitudeRadians), Math.cos(distance / Point.earthRadius) - Math.sin(latitudeRadians) * Math.sin(movedLatitudeRadians));

		// Convert the new latitude and longitude from radians to degrees
		return new Point((movedLatitudeRadians * 180) / Math.PI, (movedLongitudeRadians * 180) / Math.PI);
	}

	distance(point: Point) {
		// convert latitude and longitude from degrees to radians
		const lat1Rad = (this.latitude * Math.PI) / 180;
		const lon1Rad = (this.longitude * Math.PI) / 180;
		const lat2Rad = (point.latitude * Math.PI) / 180;
		const lon2Rad = (point.longitude * Math.PI) / 180;
		
		// Haversine formula
		const dLat = lat2Rad - lat1Rad;
		const dLon = lon2Rad - lon1Rad;
		
		const offset = Math.sin(dLat / 2) * Math.sin(dLat / 2) + Math.cos(lat1Rad) * Math.cos(lat2Rad) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
		const centralAngle = 2 * Math.atan2(Math.sqrt(offset), Math.sqrt(1 - offset));
		
		// Calculate the distance
		const distance = Point.earthRadius * centralAngle;
		
		return distance;
	}

	clone() {
		return new Point(this.latitude, this.longitude);
	}

	toString() {
		return `${this.latitude},${this.longitude}`;
	}
}