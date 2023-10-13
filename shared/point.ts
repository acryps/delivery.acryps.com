export class Point {
	constructor(
		public latitude: number,
		public longitude: number
	) {}

	static from(points) {
		return new Point(points.latitude, points.longitude);
	}

	walk(direction: number, distance: number) {
		return new Point(
			this.latitude - Math.sin(direction) * distance,
			this.longitude - Math.cos(direction) * distance,
		)
	}

	distance(point: Point) {
		return Math.sqrt(
			(this.latitude - point.latitude) ** 2 +
			(this.longitude - point.longitude) ** 2
		);
	}

	clone() {
		return new Point(this.latitude, this.longitude);
	}
}