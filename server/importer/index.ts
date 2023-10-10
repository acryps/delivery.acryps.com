import { DbContext } from "../managed/database";
import { MapReader } from "./mapreader";

export function importArea(database: DbContext) {
	let mapreader = new MapReader();
	mapreader.readMap();

}