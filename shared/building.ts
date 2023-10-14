import { Point } from "./point";
import { Rectangle } from "./rectangle";

export class BuildingViewModel {
	boundingBox: Rectangle;

	constructor (
		public id: string,
		public address: string,
		public geometry: Point[]
	) {
		this.boundingBox = Rectangle.fromPolygon(geometry);
	}

	get entrance() {
		return this.geometry[0];
	}

	static from(serialized) {
		return new BuildingViewModel(
			serialized.id,
			serialized.address,
			serialized.geometry.map(point => Point.from(point))
		);
	}

	get area() {
		const geometryLength = this.geometry.length;
		let area = 0;
		
		for (let pointIndex = 0; pointIndex < geometryLength; pointIndex++) {
			const currentPoint = this.geometry[pointIndex];
			const currentLatitude = currentPoint.latitude * (Math.PI / 180);
			const currentLongitude = currentPoint.longitude * (Math.PI / 180);

			const nextPoint = this.geometry[(pointIndex + 1) % geometryLength];
			const nextLatitude = nextPoint.latitude * (Math.PI / 180);
			const nextLongitude = nextPoint.longitude * (Math.PI / 180);
			
			area += (nextLongitude + currentLongitude) * (Math.sin(nextLatitude) - Math.sin(currentLatitude));
		}
		
		area = Math.abs(area * Point.earthRadius * Point.earthRadius / 2.0); // Earth's radius in km
		
		return area;
	}

	get center() {
		let totalLatitude = 0;
		let totalLongitude = 0;

		for (let point of this.geometry) {
			totalLatitude += point.latitude;
			totalLongitude += point.longitude;
		}

		return new Point(
			totalLatitude / this.geometry.length,
			totalLongitude / this.geometry.length
		);
	}
}