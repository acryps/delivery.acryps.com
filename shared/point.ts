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
}