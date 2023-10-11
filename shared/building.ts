import { Point } from "./point";

export class BuildingViewModel {
	constructor (
		public address: string,
		public geometry: Point[]
	) {}
}