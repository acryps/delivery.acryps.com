import { Point } from "./point";

export class Rectangle {
	constructor(
		public minLatitude: number,
		public maxLatitude: number,
		public minLongitude: number,
		public maxLongitude: number
	) {}

	get center() {
		return new Point(
			this.minLatitude + (this.maxLatitude - this.minLatitude) / 2,
			this.minLongitude + (this.maxLongitude - this.minLongitude) / 2
		);
	}

	static fromCenter(center: Point, latitude: number, longitude: number) {
		return new Rectangle(
			center.latitude - latitude / 2,
			center.latitude + latitude / 2,
			center.longitude - longitude / 2,
			center.longitude + longitude / 2
		);
	}

	static fromCenterRadius(center: Point, radius: number) {
		const centerLatRad = (center.latitude * Math.PI) / 180;
		
		// Calculate the angular distance in radians
		const angularDistance = radius / Point.earthRadius;
		
		// Calculate the bounding box coordinates
		return this.fromCenter(
			center, 
			(angularDistance * 180) / Math.PI,
			(angularDistance * 180) / (Math.PI * Math.cos(centerLatRad))
		);
	}

	static fromPolygon(points: Point[]) {
		const latitudes = points.map(point => point.latitude);
		const longitudes = points.map(point => point.longitude);

		return new Rectangle(
			Math.min(...latitudes),
			Math.max(...latitudes),
			Math.min(...longitudes),
			Math.max(...longitudes)
		);
	}

	contains(point: Point) {
		if (point.latitude < this.minLatitude) {
			return false;
		}
		
		if (point.latitude > this.maxLatitude) {
			return false;
		}

		if (point.longitude < this.minLongitude) {
			return false;
		}
		
		if (point.longitude > this.maxLongitude) {
			return false;
		}

		return true;
	}

	touches(smaller: Rectangle) {
		if (smaller.minLatitude >= this.minLatitude && smaller.minLatitude <= this.maxLatitude) {
			if (smaller.minLongitude >= this.minLongitude && smaller.minLongitude <= this.maxLongitude) {
				return true;
			}

			if (smaller.maxLongitude >= this.minLongitude && smaller.maxLongitude <= this.maxLongitude) {
				return true;
			}
		}

		if (smaller.maxLatitude >= this.minLatitude && smaller.maxLatitude <= this.maxLatitude) {
			if (smaller.minLongitude >= this.minLongitude && smaller.minLongitude <= this.maxLongitude) {
				return true;
			}

			if (smaller.maxLongitude >= this.minLongitude && smaller.maxLongitude <= this.maxLongitude) {
				return true;
			}
		}
	}
}