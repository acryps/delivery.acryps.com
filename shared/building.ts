import { Point } from "./point";

export class BuildingViewModel {
	constructor (
		private address: string,
		private geometry: Point[]
	) {}
}