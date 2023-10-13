import { BuildingViewModel } from "./building";
import { Delivery } from "./delivery";
import { Point } from "./point";
import { Rectangle } from "./rectangle";

export class Map {
	readonly maximalSearchedBuildingArea = 5e-7;

	constructor (
		public center: Point,
		public radius: number,
		public buildings: BuildingViewModel[]
	) {}

	static from(serialized) {
		return new Map(
			Point.from(serialized.center),
			serialized.radius,
			serialized.buildings.map(building => BuildingViewModel.from(building))
		);
	}

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
					return building;
				}
			}
		}

		return false;
	}

	planDelivery(usedBuildings: BuildingViewModel[]) {
		const angle = Math.random() * Math.PI * 2;
		const distance = Math.random() * this.radius / 4 + this.radius / 2;

		const delivery = new Delivery();
		delivery.source = this.searchBuilding(angle, distance, usedBuildings);
		delivery.destination = this.searchBuilding(angle + Math.PI, distance, usedBuildings);

		return delivery;
	}

	searchBuilding(angle: number, distance: number, skip: BuildingViewModel[], attempts = 0) {
		if (!this.buildings.length) {
			return;
		}

		if (attempts == 1000) {
			return this.buildings[Math.floor(Math.random() * this.buildings.length)];
		}

		const probe = this.center.walk(angle, distance);
		
		for (let building of this.buildings) {
			if (Rectangle.fromPolygon(building.geometry).contains(probe)) {
				if (!skip.includes(building) && building.area < this.maximalSearchedBuildingArea) {
					return building;
				}
			}
		}

		return this.searchBuilding(angle + Math.random() * 0.1 - 0.05, distance + Math.random() / 1000 - 0.0005, skip, attempts + 1);
	}
}