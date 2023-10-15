import { Point } from "./point";
import { Rectangle } from "./rectangle";

export class Railway {
	static readonly defaultGauge = 1435;
	static readonly padding = 0.5;

	boundingBox: Rectangle;

	constructor(
		public path: Point[],
		public gauge: number
	) {
		this.boundingBox = Rectangle.fromPolygon(path);
	}

	static from(serialized) {
		return new Railway(
			serialized.path.map(point => Point.from(point)),
			serialized.gauge ?? this.defaultGauge
		);
	}
}