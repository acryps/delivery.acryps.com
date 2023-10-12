import { Point } from "./point";

export class BuildingViewModel {
	constructor (
		public id: string,
		public address: string,
		public geometry: Point[]
	) {}

	get entrance() {
		return this.geometry[0];
	}
}