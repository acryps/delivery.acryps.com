export class Point {
	constructor(
		public latitude: number,
		public longitude: number
	) {}

	static from(packed: string) {
		const components = packed.split(',');

		return new Point(+components[0], +components[1]);
	}
}