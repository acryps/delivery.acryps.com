import { BuildingViewModel } from "./building";
import { Point } from "./point";
import { Rectangle } from "./rectangle";

export class Map {
	constructor (
		public center: Point,
		public radius: number,
		public buildings: BuildingViewModel[]
	) {}

	collides(point: Point) {
		for (let building of this.buildings) {
			if (Rectangle.fromPolygon(building.geometry).contains(point)) {
				return true;
			}
		}

		return false;
	}

	searchBuilding(angle: number, distance: number, attempts = 0) {
		if (!this.buildings.length) {
			throw new Error('no buildings in this map');
		}

		if (attempts == 1000) {
			return this.buildings[Math.floor(Math.random() * this.buildings.length)];
		}

		const probe = this.center.walk(angle, distance);
		
		for (let building of this.buildings) {
			if (Rectangle.fromPolygon(building.geometry).contains(probe)) {
				return building;
			}
		}

		return this.searchBuilding(angle + Math.random() * 0.1 - 0.05, distance + Math.random() / 1000 - 0.0005, attempts + 1);
	}
}