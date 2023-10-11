export class Point {
	constructor(
		public latitude: number,
		public longitude: number
	) {}

	static from(points) {
		return new Point(points.latitude, points.longitude);
	}
}