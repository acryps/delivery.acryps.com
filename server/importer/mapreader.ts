import * as convert from "xml-js";
import * as fs from 'fs';

import { Building, DbContext, WaterBody } from "../managed/database";
import { Rectangle } from "../../shared/rectangle";
import { Point } from "../../shared/point";

const fileName = 'zurich-tiny';
const cwd = process.cwd() + "/importer";

export class MapReader {
	nodes;
	ways;
	relations;
	db;

	constructor(db: DbContext) {
		this.db = db;
		let jsonData = this.readMap();

		this.nodes = jsonData.osm.node;
		this.ways = jsonData.osm.way;
		this.relations = jsonData.osm.relation;

		console.debug("sizes: " + this.nodes.length + " " + this.ways.length + " " + this.relations.length);
	}


	calculateBoundingBox(startLocation: Point) {
		let loadedArea: Point;

		let toLoadBoundingBoxes: Point[];

		// todo: load the boundingBoxes
	}

	async getXML() {
		const mapURL = `http://overpass.openstreetmap.ru/cgi/xapi_meta?*[bbox=8.2827,47.0316,8.3425,47.0598]`;
		
		try {
			var map = await fetch(mapURL).then(response => response.text())
		} catch (error) {
			console.error(error);
		}

		return map;
	}

	async readMapFromXml() {
		try {
			let xmlData = await this.getXML();
			let jsonString = convert.xml2json(xmlData, {compact: true, spaces: 4});
			var jsonData = JSON.parse(jsonString);
		} catch (error) {
			console.error(error);
		}

		return jsonData;
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

	async loadBuildings() {
		let buildings = this.findByTag("building");
		let buildingsDB: Building[] = [];

		buildings.forEach(async building => {
			let polygonString = this.constructPolygonString(building);

			let address = this.extractAddress(building);

			let center = this.calculateCenter(this.getPoint(building));

			let osmId = building._attributes.id;

			let buildingDB = new Building();
			buildingDB.address = address;
			buildingDB.centerLatitude = center.latitude;
			buildingDB.centerLongitude = center.longitude;
			buildingDB.polygon = polygonString;

			buildingsDB.push(buildingDB);

			await buildingDB.create();
		});

		//console.debug(buildingsDB.length);
		// for(let i: number = 0; i < 100; i++) {
		// 	//console.debug(buildingsDB[i]);
		// 	await buildingsDB[i].create();
		// }		

		return buildings;
	}

	async loadWater() {
		let waters =  this.findByTag('water');
		let watersDB: WaterBody[] = [];

		for (let water of waters) {
			if (water.member) {
				const coordinates = [];

				for (let member of water.member) {
					const way = this.findMember(member);
					
					if (way) {
						coordinates.push(...this.getPoint(way));
					}
				}

				let center = this.calculateCenter(coordinates);
				let polygonString = this.constructPolygonFromPoint(coordinates);

				let waterDB = new WaterBody();
				waterDB.centerLatitude = center.latitude;
				waterDB.centerLongitude = center.longitude;
				waterDB.polygon = polygonString;
				waterDB.name = water._attributes.name ?  water._attributes.name : 'water';

				watersDB.push(waterDB);

				await waterDB.create();
			} else {
				let coordinates = [];

				coordinates = this.getPoint(water);

				let center = this.calculateCenter(coordinates);
				let polygonString = this.constructPolygonFromPoint(coordinates);

				let waterDB = new WaterBody();
				waterDB.centerLatitude = center.latitude;
				waterDB.centerLongitude = center.longitude;
				waterDB.polygon = polygonString;
				waterDB.name = water._attributes.name ?  water._attributes.name : 'water';

				watersDB.push(waterDB);

				await waterDB.create();
			}
		}

		return waters;
	}

	getStreets() {
		let highways = this.findByTag("highway");

		highways.forEach(highway => {
			let coordinates: Point[] = this.getPoint(highway);

			//console.debug(highway);

			coordinates.forEach(coord => {
				//console.debug(coord.toString());
			});

		});

		return highways;
	}

	findMember(member) {
		let memberId = member._attributes.ref;
		let searchedWay;

		this.ways.map(way => {
			if (way._attributes.id == memberId) {
				searchedWay = way;
			}
		});

		return searchedWay;
	}

	constructPolygonFromPoint(coordinates: Point[]) {
		let polygonString = '';

		for (let coordinate of coordinates) {
			if (coordinate == coordinates[coordinates.length - 1]) {
				polygonString += `${coordinate.latitude},${coordinate.longitude}`;
			} else {
				polygonString += `${coordinate.latitude},${coordinate.longitude};`;
			}
		}

		return polygonString;
	}

	getPointOfNode(id: string): Point {
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
		return new Point(+node._attributes.lat, +node._attributes.lon);
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
	findByTag(attribute: string) {
		const filtered = [];

		for (let item of [...this.ways, ...this.relations]) {
			if (item.tag) {
				if (Array.isArray(item.tag)) {
					for (let tag of item.tag) {
						if (tag._attributes.k == attribute) {
							filtered.push(item);
						}
					}
				} else {
					if (item.tag._attributes.k == attribute) {
						filtered.push(item);
					}
				}
			}
		}

		return filtered;
	}

	/**
	 * returns the coordinates, which form the polygon of the given "way" object
	 * @param way 
	 * @returns 
	 */
	getPoint(way): Point[] {
		let coordinates: Point[] = [];
		let nodes = way.nd;

		if(nodes) {
			if(nodes.length > 1) {
				nodes.forEach(buildingNode => {
					let nodeRef = buildingNode._attributes.ref;
					coordinates.push(this.getPointOfNode(nodeRef));
				});
			}
			else {
				let nodeRef = nodes._attributes.ref;
				coordinates.push(this.getPointOfNode(nodeRef));
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
					let coordinates: Point = this.getPointOfNode(nodeRef);
					polygonString = coordinates.toString() + ";" + polygonString;
				});
			}
			else {
				let nodeRef = buildingNodes._attributes.ref;
				let coordinates: Point = this.getPointOfNode(nodeRef);
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
		let houseNumber: string = "";
		let postcode: string = "";
		let street: string = "";

		if(buildingTags && buildingTags.length > 1) {
			buildingTags.forEach(tag => {
				switch (tag._attributes.k) {
					case "addr:city":
						city = tag._attributes.v;
						break;
					case "addr:housenumber":
						houseNumber = tag._attributes.v;
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

		return `${street} ${houseNumber} ${postcode} ${city}`;
	} 

	calculateCenter(points: Point[]) {
		return Rectangle.fromPolygon(points).center;
	}
}
