import { Coordinates } from "./coordinates";
import * as convert from "xml-js";
import * as fs from 'fs';
import { DbContext } from "../managed/database";

const fileName = 'oberarth';
const cwd = process.cwd() + "/importer";

export class MapReader {
	jsonData;
	nodes;
	ways;
	relations;

	db;

	constructor(db: DbContext) {
		this.db = db;
		this.jsonData = this.readMap();

		this.nodes = this.jsonData.osm.node;
		this.ways = this.jsonData.osm.way;
		this.relations = this.jsonData.osm.relation;
	}

	readMap() {
		const xmlFilePath = cwd + "/map/" + fileName + ".osm";

		try {
			let xmlData = fs.readFileSync(xmlFilePath, 'utf8');
			let jsonString = convert.xml2json(xmlData, {compact: true, spaces: 4});
			var jsonData = JSON.parse(jsonString);
		} catch (error) {
			console.error(error);
		}

		return jsonData;
	}

	getBuildings() {
		let buildings = this.filterWaysByAttribute("building");

		buildings.forEach(building => {
			let polygonString = this.constructPolygonString(building);

			let address = this.extractAddress(building);

			let center = this.calculateCenter(this.getCoordinates(building));

		});

		return buildings;
	}

	getStreets() {
		let highways = this.filterWaysByAttribute("highway");
		// todo:
		// get street names
		// get corner points
		// calculate center

		return highways;
	}


	getCoordinatesOfNode(id: string): Coordinates {
		let filteredNodes = this.nodes.filter(element => element._attributes.id === id);

		if(filteredNodes.length > 1) {
			console.error("didn't get unique element");
			return null;
		}
		if(filteredNodes.length == 0) {
			console.error("got no elements");
			return null;
		}

		let node = filteredNodes[0];	
		return new Coordinates(+node._attributes.lat, +node._attributes.lon);
	}

	getNode(id: string) {
		let node = this.nodes.filter(element => element._attributes.id === id);

		if(node === null) console.error("no node returned");

		return node;
	}

	/**
	 * returns the "way" objects which have a tag with the given attribute.
	 * @param attribute 
	 * @returns 
	 */
	filterWaysByAttribute(attribute: string) {
		let filtered = [];
		this.ways.forEach(way => {
			if(way.tag) {
				if(way.tag.length > 1) {
					way.tag.forEach(wayTag => {
						if(wayTag._attributes.k === attribute) filtered.push(way);
					});
				}
				else {
					if(way.tag._attributes.k === attribute) filtered.push(way);
				}
			}
		});
		return filtered;
	}

	/**
	 * returns the coordinates, which form the polygon of the given building
	 * @param building 
	 * @returns 
	 */
	getCoordinates(building): Coordinates[] {
		let coordinates: Coordinates[] = [];
		let buildingNodes = building.nd;

		if(buildingNodes) {
			if(buildingNodes.length > 1) {
				buildingNodes.forEach(buildingNode => {
					let nodeRef = buildingNode._attributes.ref;
					coordinates.push(this.getCoordinatesOfNode(nodeRef));
				});
			}
			else {
				let nodeRef = buildingNodes._attributes.ref;
				coordinates.push(this.getCoordinatesOfNode(nodeRef));
			}
		}

		return coordinates;
	}

	/**
	 * constructs a string containing latitude and longitude which define the polygon of a building.
	 * the constructed polygonstring has the following format: [latitude], [longitude] ; [latitude], [longitude] ; ...
	 * @param building 
	 * @returns 
	 */
	constructPolygonString(building): string {
		let polygonString = "";
		let buildingNodes = building.nd;

		if(buildingNodes) {
			if(buildingNodes.length > 1) {
				buildingNodes.forEach(buildingNode => {
					let nodeRef = buildingNode._attributes.ref;
					let coordinates: Coordinates = this.getCoordinatesOfNode(nodeRef);
					polygonString = coordinates.toString() + ";" + polygonString;
				});
			}
			else {
				let nodeRef = buildingNodes._attributes.ref;
				let coordinates: Coordinates = this.getCoordinatesOfNode(nodeRef);
				polygonString = coordinates.toString() + ";" + polygonString;
			}
		}
		return polygonString;
	}

	/**
	 * extracts address of the given building, if the address is defined. otherwise it returns an empty string.
	 * the address has the following format: [street] [housenumber] [postcode] [city]
	 * @param building 
	 * @returns 
	 */
	extractAddress(building): string {
		let buildingTags = building.tag;
		let city: string = "";
		let housenumber: string = "";
		let postcode: string = "";
		let street: string = "";

		if(buildingTags && buildingTags.length > 1) {
			buildingTags.forEach(tag => {
				switch (tag._attributes.k) {
					case "addr:city":
						city = tag._attributes.v;
						break;
					case "addr:housenumber":
						housenumber = tag._attributes.v;
						break;
					case "addr:postcode":
						postcode = tag._attributes.v;
						break;
					case "addr:street":
						street = tag._attributes.v;
						break;
					default:
						break;
				}
			});
		}
		else {
			console.warn("building has no address");
		}

		return street + " " + housenumber + " " + postcode + " " + city;
	} 
	
	/**
	 * calculates the approximate center of the given coordinates
	 * @param coordinates 
	 * @returns approximate center
	 */
	calculateCenter(coordinates: Coordinates[]): Coordinates {
		let sumLatitude = 0;
		let sumLongitude = 0;

		coordinates.forEach(coordinate => {
			sumLatitude += coordinate.latitude;
			sumLongitude += coordinate.longitude;
		});

		let numberOfCoordinates = coordinates.length;
		let center: Coordinates = new Coordinates(sumLatitude/numberOfCoordinates, sumLongitude/numberOfCoordinates);
	
		return center;
	}
}
