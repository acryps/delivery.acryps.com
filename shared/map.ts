import { BuildingViewModel } from "./building";
import { Point } from "./point";
import { Rectangle } from "./rectangle";

export class Map {
	constructor (
		public center: Point,
		public radius: number,
		public buildings: BuildingViewModel[]
	) {}

	searchBuilding(angle: number, distance: number) {
		if (!this.buildings.length) {
			throw new Error('no buildings in this map');
		}

		const probe = this.center.walk(angle, distance);

		for (let building of this.buildings) {
			// TODO add point check if (Rectangle.fromPolygon(building.geometry).contains(probe)) {
			return building;
			// }
		}

		return this.searchBuilding(angle + Math.random() * 0.1 - 0.05, distance + Math.random() / 1000 - 0.0005);
	}
}