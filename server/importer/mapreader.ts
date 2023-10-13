import { Coordinates } from "./coordinates";
import * as convert from "xml-js";
import { Building, DbContext, Import } from "../managed/database";
import { LoadingArea } from "./loading-area";

export class MapReader {
	nodes;
	ways;
	relations;

	constructor(
		private database: DbContext,
		private loadingArea: LoadingArea
	) {}

	async loadMap(): Promise<boolean> {
		let jsonData = await this.readMapFromXml();

		this.nodes = jsonData.osm.node;
		this.ways = jsonData.osm.way;
		this.relations = jsonData.osm.relation;

		console.debug("loading map for loading area around: lat:" + this.loadingArea.center.latitude + ", long:" + this.loadingArea.center.longitude);

		if(this.nodes.length > 1 && this.ways.length > 1) {

			// todo: uncomment, when rest ist tested!!
			if(await this.loadBuildings() /*&& this.loadStreets() && this.loadWater()*/) {
				return true;
			}
			return false;
		}
		else {
			return false;
		}
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

	async getXML() {
		let boundingBox = 
			this.loadingArea.getBoundingBox().minLongitude.toFixed(6) + "," + 
			this.loadingArea.getBoundingBox().minLatitude.toFixed(6)+ "," + 
			this.loadingArea.getBoundingBox().maxLongitude.toFixed(6) + "," + 
			this.loadingArea.getBoundingBox().maxLatitude.toFixed(6);
		const mapURL = 'http://overpass-api.de/api/map?bbox=' + boundingBox;

		console.debug(
			"latitude = [" + this.loadingArea.getBoundingBox().minLatitude.toFixed(4) + ", " + this.loadingArea.getBoundingBox().maxLatitude.toFixed(4) + "], " + 
			"longitude = [" + this.loadingArea.getBoundingBox().minLongitude.toFixed(4) + ", " + this.loadingArea.getBoundingBox().maxLongitude.toFixed(4) +"], "+
			"loading from: " + mapURL
			);
		
		try {
			var map = await fetch(mapURL).then(response => response.text())
		} catch (error) {
			console.error(error);
		}

		return map;
	}

	async loadBuildings(): Promise<boolean> {
		try {
			let buildings = this.filterWaysByAttribute("building");

			buildings.forEach(async building => {
				let polygonString = this.constructPolygonString(building);
	
				let address = this.extractAddress(building);
	
				let center = this.calculateCenter(this.getPoints(building));
	
				let buildingDB = new Building();
				buildingDB.address = address;
				buildingDB.centerLatitude = center.latitude;
				buildingDB.centerLongitude = center.longitude;
				buildingDB.polygon = polygonString;
				buildingDB.importerId = building._attributes.id;
				buildingDB.addressReal = true;
	
				await buildingDB.create();
			});

			return true;
		} catch (error) {
			return false;
		}	
	}

	async loadStreets() {
		let highways = this.filterWaysByAttribute("highway");

		highways.forEach(highway => {
			let coordinates: Coordinates[] = this.getPoints(highway);

			//console.debug(highway);

			coordinates.forEach(coord => {
				//console.debug(coord.toString());
			});

		});

		return highways;
	}

	async loadWater() {
		let water = this.filterWaysByAttribute('water');

		water.forEach(waterArea => {
			let coordinates: Coordinates[];

			coordinates = this.getPoints(waterArea);

			console.debug('coordinates: ', coordinates);
		})
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
	 * returns the coordinates, which form the polygon of the given "way" object
	 * @param tag 
	 * @returns 
	 */
	getPoints(tag): Coordinates[] {
		let coordinates: Coordinates[] = [];
		let nodes = tag.nd;

		if(nodes) {
			if(nodes.length > 1) {
				nodes.forEach(buildingNode => {
					let nodeRef = buildingNode._attributes.ref;
					coordinates.push(this.getCoordinatesOfNode(nodeRef));
				});
			}
			else {
				let nodeRef = nodes._attributes.ref;
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

	extractAddress(building) {
		let buildingTags = building.tag;
		let city = "";
		let street = "";
		let postcode = "";
		let houseNumber = "";

		let address = '';

					if (buildingTags._attributes.k == "addr:city"
				&& buildingTags._attributes.k == "addr:postcode"
				&& buildingTags._attributes.k == "addr:street"
				&& buildingTags._attributes.k == "addr:housenumber"
			) {
				for (let tag of buildingTags) {
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
				}
			} else {
				
			}
		
		for (let tag of buildingTags) {
			if (tag._attributes.k == "addr:city") {
				city = tag._attributes.v;
			} else {
				// get the closest city
				city = this.getMissingAddress(city);
			}

			if (tag._attributes.k == "addr:postcode") {
				postcode = tag._attributes.v;
			} else {
				// get the closest postcode
				postcode = this.getMissingAddress(postcode);
			}

			if (tag._attributes.k == "addr:street") {
				street = tag._attributes.v;
			} else {
				// get the closest street
				street = this.getMissingAddress(street);
			}

			if (tag._attributes.k == "addr:housenumber") {
				houseNumber = tag._attributes.v;
			} else {
				// get the closest house number
				houseNumber = this.getMissingAddress(houseNumber);
			}
		}

		return `${street} ${houseNumber} ${postcode} ${city}`;
	}

	getMissingAddress(object) {
		console.debug('searching missing ', object);


		return '';
	}

	extractAddress1(building): string {
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
			// todo: handle no address
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
