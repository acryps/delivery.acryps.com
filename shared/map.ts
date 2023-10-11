import { BuildingViewModel } from "./building";
import { Point } from "./point";

export class Map {
	constructor (
		public center: Point,
		public radius: number,
		public buildings: BuildingViewModel[]
	) {}
}