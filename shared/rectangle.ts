import { Point } from "./point";

export class Rectangle {
	constructor(
		public minLatitude: number,
		public maxLatitude: number,
		public minLongitude: number,
		public maxLongitude: number
	) {}

	get topLeft() {
		return new Point(this.minLatitude, this.minLongitude);
	}

	get topRight() {
		return new Point(this.maxLatitude, this.minLongitude);
	}

	get bottomLeft() {
		return new Point(this.minLatitude, this.maxLongitude);
	}

	get bottomRight() {
		return new Point(this.maxLatitude, this.maxLongitude);
	}

	get latitudeLength() {
		return this.topLeft.distance(this.topRight);
	}

	get longitudeLength() {
		return this.bottomLeft.distance(this.bottomRight);
	}

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
		const centerLatitudeRad = (center.latitude * Math.PI) / 180;
		
		// Calculate the angular distance in radians
		const angularDistance = radius / Point.earthRadius;
		
		// Calculate the bounding box coordinates
		return this.fromCenter(
			center, 
			(angularDistance * 180) / Math.PI,
			(angularDistance * 180) / (Math.PI * Math.cos(centerLatitudeRad))
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

	touches(other: Rectangle) {
		if (other.minLatitude >= this.minLatitude && other.minLatitude <= this.maxLatitude) {
			if (other.minLongitude >= this.minLongitude && other.minLongitude <= this.maxLongitude) {
				return true;
			}

			if (other.maxLongitude >= this.minLongitude && other.maxLongitude <= this.maxLongitude) {
				return true;
			}
		}

		if (other.maxLatitude >= this.minLatitude && other.maxLatitude <= this.maxLatitude) {
			if (other.minLongitude >= this.minLongitude && other.minLongitude <= this.maxLongitude) {
				return true;
			}

			if (other.maxLongitude >= this.minLongitude && other.maxLongitude <= this.maxLongitude) {
				return true;
			}
		}
	}

	inside(bigger: Rectangle) {
		if (bigger.minLatitude > this.minLatitude) {
			return false;
		}

		if (bigger.maxLatitude < this.maxLatitude) {
			return false;
		}

		if (bigger.minLongitude > this.minLongitude) {
			return false;
		}

		if (bigger.maxLongitude < this.maxLongitude) {
			return false;
		}

		return true;
	}
}