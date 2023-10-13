import { Point } from "../../shared/point";
import { DbContext } from "../managed/database";
import { AreaLoader } from "./area-loader";

export function importArea(startLocation: Point, database: DbContext) {

	let areaLoader = new AreaLoader(database);
	areaLoader.loadArea(startLocation);

}