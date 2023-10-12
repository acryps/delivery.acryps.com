import { DbContext } from "../managed/database";
import { Coordinates } from "./coordinates";
import { MapReader } from "./mapreader";

export function importArea(/*startLocation: Coordinates,*/ database: DbContext) {

	let mapReader = new MapReader(database);
	mapReader.readMap();
	
	// mapReader.loadWater();
	//mapReader.loadBuildings();
	//mapReader.getStreets();

}