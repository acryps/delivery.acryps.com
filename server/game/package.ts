import { Map } from "../../shared/map";
import { BuildingViewModel } from '../../shared/building';

export class Package {
	source: BuildingViewModel;
	destination: BuildingViewModel;

	constructor(map: Map) {
		const angle = Math.random() * Math.PI * 2;
		const distance = Math.random() * map.radius / 4 + map.radius / 2;

		this.source = map.searchBuilding(angle, distance);
		this.destination = map.searchBuilding(angle + Math.PI, distance);
	}

	toJSON() {
		return {
			source: this.source.id,
			destination: this.destination.id
		};
	}
}