import * as convert from "xml-js";
import { Building, DbContext, Import, WaterBody } from "../managed/database";
import { LoadingArea } from "./loading-area";
import { Point } from "../../shared/point";
import { Rectangle } from "../../shared/rectangle";

export class MapReader {
	nodes;
	ways;
	relations;

	buildingPointsDatabase: Point[] = [];
	buildingsDatabase;


	constructor(
		private database: DbContext,
		private loadingArea: LoadingArea
	) {}

	async loadMap(): Promise<boolean> {
		let jsonData = await this.readMapFromXml();

		this.nodes = Array.isArray(jsonData.osm.node) ? jsonData.osm.node : [jsonData.osm.node];
		this.ways = Array.isArray(jsonData.osm.way) ? jsonData.osm.way : [jsonData.osm.way];
		this.relations = Array.isArray(jsonData.osm.relation) ? jsonData.osm.relation : [jsonData.osm.relation];

		console.debug("loading map for loading area around: lat:" + this.loadingArea.center.latitude + ", long:" + this.loadingArea.center.longitude);

		if(this.nodes && this.ways) {

			if(await this.saveBuildings() /*&& this.loadStreets() && this.loadWater()*/) {
				console.debug("finished loading");

				this.loadBuildingsFromDatabase();

				return true;
			}
		}
		return false;
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

	loadBuildingsFromDatabase() {
		this.buildingsDatabase = this.database.building.toArray();
		this.buildingsDatabase = Array.isArray(this.buildingsDatabase) ? this.buildingsDatabase : [this.buildingsDatabase];

		for (let buildingDatabase of this.buildingsDatabase) {
			this.buildingPointsDatabase.push(new Point(buildingDatabase.centerLatitude, buildingDatabase.centerLongitude));
		}
	}

	async saveBuildings() {
		console.debug("starting to load buildings");

		let buildings = this.findByTag("building");
		
		console.debug('loading ' + buildings.length + ' buildings');

		for (let building of buildings) {
			let openStreetMapId = building._attributes.id;

			if (!this.isBuildingLoaded(openStreetMapId)) {
				let center: Point = this.calculateCenter(this.getPoint(building));
				let address = await this.extractAddress(building);

				let buildingDB = new Building();
				buildingDB.addressReal = true;

				if (!address) {
					// address = await this.getMissingAddress(center);
					buildingDB.addressReal = false;
				}

				buildingDB.address = address;
				buildingDB.centerLatitude = center.latitude;
				buildingDB.centerLongitude = center.longitude;
				buildingDB.polygon = this.constructPolygonString(building);
				buildingDB.importerId = openStreetMapId;

				await buildingDB.create();
			} 
		};	

		return buildings;
	}

	async loadWater() {
		let waters =  this.findByTag('water');
		let watersDB: WaterBody[] = [];

		for (let water of waters) {
			let coordinates = [];

			if (water.member) {
				for (let member of water.member) {
					const way = this.findMember(member);
					
					if (way) {
						coordinates.push(...this.getPoint(way));
					}
				}
			} else {
				coordinates = this.getPoint(water);
			}

			let center = this.calculateCenter(coordinates);
			let polygonString = this.constructPolygonFromPoint(coordinates);

			let waterDB = new WaterBody();
			waterDB.centerLatitude = center.latitude;
			waterDB.centerLongitude = center.longitude;
			waterDB.polygon = polygonString;
			waterDB.name = 'water';

			if (water.tag) {
				for (let tag of water.tag) {
					if (tag._attributes.k == 'name') {
						waterDB.name = tag._attributes.v;
					}
				}
			}

			watersDB.push(waterDB);

			await waterDB.create();
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

	/**
	 * constructs a string containing latitude and longitude which define the polygon of a building.
	 * the constructed polygonstring has the following format: [latitude], [longitude] ; [latitude], [longitude] ; ...
	 * @param building 
	 * @returns 
	 */
	constructPolygonString(building): string {
		let buildingNodes = building.nd;
		let buildingCoordinateString: string[] = [];

		if(buildingNodes) {
			if(buildingNodes.length > 1) {
				buildingNodes.forEach(buildingNode => {
					buildingCoordinateString.push(this.getPointOfNode(buildingNode._attributes.ref).toString());
				});
			}
			else {
				buildingCoordinateString.push(this.getPointOfNode(buildingNodes._attributes.ref).toString());
			}
		}

		return buildingCoordinateString.join(';');
	}

	getPointOfNode(id: string): Point {
		let filteredNodes = this.nodes.filter(element => element._attributes.id === id);

		if(!Array.isArray(filteredNodes)) {
			console.error("got no elements");
			return null;
		}
		if(filteredNodes.length > 1) {
			console.error("didn't get unique element");
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
			if (item && item.tag) {
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

		return Array.isArray(filtered) ? filtered : [filtered];
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



	async extractAddress(building) {
		let buildingNodes = building.nd;

		if (buildingNodes) {
			buildingNodes = Array.isArray(buildingNodes) ? buildingNodes : [buildingNodes];

			for (let buildingNode of buildingNodes) {
				let buildingNodeTags = this.getNode(buildingNode._attributes.ref)[0].tag;
				let address = this.addressFromTags(buildingNodeTags);

				if (address) {
					return address;
				}
			}
		}

		return this.addressFromTags(building.tag);
	}

	addressFromTags(tags): string {
		if (Array.isArray(tags)) {
			let city;
			let street;
			let postcode;
			let houseNumber;

			for (let tag of tags) {
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

			if (city && houseNumber && postcode && street) {
				return `${street} ${houseNumber} ${postcode} ${city}`;
			} else if(street && houseNumber) {
				return `${street} ${houseNumber}`;
			}
		} 
		return;
	}

	async getMissingAddress(center: Point) {
		let address = '';

		const nearestPoint = this.findNearestPoint(center, this.buildingPointsDatabase);

		for (let building of this.buildingsDatabase) {
			if (building.centerLatitude == nearestPoint.latitude && building.centerLongitude == nearestPoint.longitude) {
				address = building.address;
			}
		}

		return address;
	}

	findNearestPoint(center: Point, points: Point[]) {
		let minDistance = Infinity;
		let nearestPoint = center;

		console.debug("trying to find nearest point to: " + center);
		console.debug('points ' + points.length);

		for (let point of points) {
			const distance = this.calculateDistance(center, point);
			//console.debug('distance to ' + point + ' is ' + distance + ' mindistance ' + minDistance);

			if (distance !== 0 && distance < minDistance) {
				minDistance = distance;
				nearestPoint = point;
			}

			//console.debug('nearest point to ' + center + ' is ' + nearestPoint);
		}

		console.debug('nearest point to ' + center + ' is ' + nearestPoint + ' with distance ' + minDistance);

		return nearestPoint;
	}

	calculateDistance(center, point) {
		const latitudeDifference = point.latitude - center.latitude;
		const longitudeDifference = point.longitude - center.longitude;
	
		const distance = Math.sqrt(latitudeDifference * latitudeDifference + longitudeDifference * longitudeDifference);
	
		return distance;
	}

	async isBuildingLoaded(openStreetMapId) {
		let buildings = await this.database.building.where(building => building.importerId === openStreetMapId).toArray();
		
		if (Array.isArray(buildings)) return true;

		return false;
	}

	calculateCenter(points: Point[]) {
		return Rectangle.fromPolygon(points).center;
	}
}
