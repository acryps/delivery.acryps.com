import { Point } from "./point";
import { Rectangle } from "./rectangle";

export class WaterBody {
	boundingBox: Rectangle;

	constructor (
		public polygon: Point[]
	) {
		this.boundingBox = Rectangle.fromPolygon(polygon);
	}

	static from(serialized) {
		return new WaterBody(
			serialized.polygon.map(point => Point.from(point))
		);
	}
}