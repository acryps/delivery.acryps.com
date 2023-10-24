import { Point } from "./point";
import { Rectangle } from "./rectangle";

export class Railway {
	static readonly defaultGauge = 1435;
	static readonly padding = 0.5;

	boundingBox: Rectangle;

	leftRail: Point[];
	rightRail: Point[];

	constructor(
		public path: Point[],
		public gauge: number
	) {
		this.boundingBox = Rectangle.fromPolygon(path);
	
		this.leftRail = this.offset(this.gauge / 2);
		this.rightRail = this.offset(-this.gauge / 2);
	}

	private offset(distance: number) {
		const offsetPath: Point[] = [];

		let angle = this.path[0].bearing(this.path[1]);

		offsetPath.push(
			this.path[0].walk(angle - Math.PI / 2, distance / 1000)
		);

		for (let pointIndex = 1; pointIndex < this.path.length - 1; pointIndex++) {
			let current = this.path[pointIndex];
			let next = this.path[pointIndex + 1];

			angle = current.bearing(next);

			offsetPath.push(
				current.walk(angle - Math.PI / 2, distance / 1000)
			);
		}

		offsetPath.push(
			this.path[this.path.length - 1].walk(angle - Math.PI / 2, distance / 1000)
		);

		return offsetPath;
	}

	static from(serialized) {
		return new Railway(
			serialized.path.map(point => Point.from(point)),
			serialized.gauge ?? this.defaultGauge
		);
	}
}