import { Coordinates } from "./coordinates";
import * as convert from "xml-js";
import * as fs from 'fs';

const fileName = 'map-small.osm';
const cwd = process.cwd() + "/importer";

export class MapReader {
	

	async readMap() {
		const xmlFilePath = cwd + "/map/" + fileName;

		var xmlData = fs.readFileSync(xmlFilePath, 'utf8');
		var jsonData = convert.xml2json(xmlData, {compact: false, spaces: 4});

	}


	getHouses() {
		// get building ways

		// get corner points of buildings
		// convert corner points into polygon string

		// get address

		// calculate center point

	}


	getStreets() {
		// todo: figure out what types of streets there are and bundle them
		// bridges, highways, paths, streets, mainstreets, ... => streets

		// get street names

		// get corner points

		// calculate center

	}

	calculateCenter(coordinates: Coordinates[]): Coordinates {
		let center: Coordinates = null;
		// todo: implement center calculations

		return center;
	}
}