import { BuildingViewModel } from "./building";
import { Delivery } from "./delivery";
import { Point } from "./point";
import { Railway } from "./railway";
import { Rectangle } from "./rectangle";

export class Map {
	readonly maximalSearchedBuildingArea = 1000;

	boundingBox: Rectangle;

	constructor (
		public center: Point,
		public radius: number,
		public buildings: BuildingViewModel[],
		public railways: Railway[]
	) {
		this.boundingBox = Rectangle.fromCenterRadius(center, radius);
	}

	static from(serialized) {
		return new Map(
			Point.from(serialized.center),
			serialized.radius,
			serialized.buildings.map(building => BuildingViewModel.from(building)),
			serialized.railways.map(railway => Railway.from(railway))
		);
	}

	collides(point: Point) {
		if (!this.boundingBox.contains(point)) {
			return this.boundingBox;
		}

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
		const availableBuildings = this.buildings
			.filter(building => building.boundingBox.inside(this.boundingBox))
			.filter(building => !usedBuildings.includes(building))
			.filter(building => building.area < this.maximalSearchedBuildingArea);

		const delivery = new Delivery();
		delivery.source = availableBuildings[Math.floor(Math.random() * availableBuildings.length)];

		const preferredDistance = this.radius;
		const distances: { building: BuildingViewModel, distance: number }[] = [];

		for (let building of availableBuildings) {
			distances.push({ 
				building,
				distance: Math.abs(preferredDistance - building.center.distance(delivery.source.center))
			});
		}

		distances.sort((a, b) => a.distance - b.distance);
		delivery.destination = distances[0].building;

		return delivery;
	}
}