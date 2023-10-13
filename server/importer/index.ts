import { Point } from "../../shared/point";
import { DbContext } from "../managed/database";
import { MapReader } from "./mapreader";

export function importArea(startLocation: Point, database: DbContext) {
	let mapReader = new MapReader(database);
}