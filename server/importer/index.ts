import { DbContext } from "../managed/database";
import { Coordinates } from "./coordinates";
import { MapReader } from "./mapreader";

export function importArea(/*startLocation: Coordinates,*/ database: DbContext) {

	let mapreader = new MapReader(database);
	mapreader.readMap();

	//mapreader.loadBuildings();
	//mapreader.getStreets();

}