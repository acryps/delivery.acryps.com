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
				let insidePolygon = false;

				for (let current = 0, previous = building.geometry.length - 1; current < building.geometry.length; previous = current++) {
					const currentLongitude = building.geometry[current].longitude;
					const currentLatitude = building.geometry[current].latitude;
					const previousLongitude = building.geometry[previous].longitude;
					const previousLatitude = building.geometry[previous].latitude;

					const intersect =
						currentLatitude > point.latitude !== previousLatitude > point.latitude &&
						point.longitude < ((previousLongitude - currentLongitude) * (point.latitude - currentLatitude)) / (previousLatitude - currentLatitude) + currentLongitude;

					if (intersect) {
						insidePolygon = !insidePolygon;
					}
				}

				if (insidePolygon) {
					return true;
				}
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