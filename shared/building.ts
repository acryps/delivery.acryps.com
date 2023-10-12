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