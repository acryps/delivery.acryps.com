import * as convert from 'xml-js';
import { Building, DbContext, Import, WaterBody } from '../managed/database';
import { LoadingArea } from './loading-area';
import { Point } from '../../shared/point';
import { Rectangle } from '../../shared/rectangle';

export class MapReader {
	nodes;
	ways;
	relations;

	constructor(
		private database: DbContext,
		private loadingArea: LoadingArea
	) {}

	async loadMap() {
		const jsonData = await this.readMapFromXml();

		this.nodes = Array.isArray(jsonData.osm.node) ? jsonData.osm.node : [jsonData.osm.node];
		this.ways = Array.isArray(jsonData.osm.way) ? jsonData.osm.way : [jsonData.osm.way];
		this.relations = Array.isArray(jsonData.osm.relation) ? jsonData.osm.relation : [jsonData.osm.relation];

		console.debug('[import] loading map for loading area around: lat:' + this.loadingArea.center.latitude + ', long:' + this.loadingArea.center.longitude);

		if (this.nodes && this.ways) {
			if (await this.saveBuildings() && this.loadWater() /*&& this.loadStreets()*/) {
				console.debug('[import] finished loading data into database');

				this.guessMissingAddresses();

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
			this.loadingArea.getBoundingBox().minLongitude.toFixed(6) + ',' + 
			this.loadingArea.getBoundingBox().minLatitude.toFixed(6)+ ',' + 
			this.loadingArea.getBoundingBox().maxLongitude.toFixed(6) + ',' + 
			this.loadingArea.getBoundingBox().maxLatitude.toFixed(6);
			
		const mapURL = 'http://overpass-api.de/api/map?bbox=' + boundingBox;

		console.debug(
			'[import] ' +
			'latitude = [' + this.loadingArea.getBoundingBox().minLatitude.toFixed(4) + ', ' + this.loadingArea.getBoundingBox().maxLatitude.toFixed(4) + '], ' + 
			'longitude = [' + this.loadingArea.getBoundingBox().minLongitude.toFixed(4) + ', ' + this.loadingArea.getBoundingBox().maxLongitude.toFixed(4) +'], '+
			'loading from: ' + mapURL);
		
		try {
			var map = await fetch(mapURL).then(response => response.text())
		} catch (error) {
			console.error(error);
		}

		return map;
	}

	async guessMissingAddresses() {
		console.debug('[import] loading missing addresses ... ');

		let buildingsToFix: Building[] = await this.database.building.where(building => 
			building.address == null &&
			building.centerLatitude.valueOf() < (this.loadingArea.center.latitude + (LoadingArea.size * 1.5)).valueOf() &&
			building.centerLatitude.valueOf() > (this.loadingArea.center.latitude - (LoadingArea.size * 1.5)).valueOf() &&
			building.centerLongitude.valueOf() < (this.loadingArea.center.longitude + (LoadingArea.size * 1.5)).valueOf() &&
			building.centerLongitude.valueOf() > (this.loadingArea.center.longitude - (LoadingArea.size * 1.5)).valueOf()
		).toArray();

		let buildingsDatabase = await this.database.building.where(building => 
			building.addressReal == true && 
			building.centerLatitude.valueOf() < (this.loadingArea.center.latitude + (LoadingArea.size * 1.5)).valueOf() &&
			building.centerLatitude.valueOf() > (this.loadingArea.center.latitude - (LoadingArea.size * 1.5)).valueOf() &&
			building.centerLongitude.valueOf() < (this.loadingArea.center.longitude + (LoadingArea.size * 1.5)).valueOf() &&
			building.centerLongitude.valueOf() > (this.loadingArea.center.longitude - (LoadingArea.size * 1.5)).valueOf()
		).toArray();

		for (let buildingToFix of buildingsToFix) {
			const missingAddress = await this.getMissingAddress(new Point(buildingToFix.centerLatitude, buildingToFix.centerLongitude), buildingsDatabase);
			buildingToFix.address = missingAddress;
			buildingToFix.update();
		}
		console.debug('[import] loaded missing addresses');
	}

	async saveBuildings() {
		console.debug('[import] starting to load buildings');

		const buildings = this.findByTag('building');
		
		console.debug('[import] loading ' + buildings.length + ' buildings');

		let alreadyLoaded = 0;

		for (let building of buildings) {
			let openStreetMapId = building._attributes.id;

			if (await this.isBuildingLoaded(openStreetMapId)) {
				alreadyLoaded++;
			} else {
				let center: Point = this.calculateCenter(this.getPoint(building));
				let address = await this.extractAddress(building);

				let buildingDB = new Building();
				buildingDB.addressReal = !address ? false : true;
				buildingDB.address = address;
				buildingDB.centerLatitude = center.latitude;
				buildingDB.centerLongitude = center.longitude;
				buildingDB.polygon = this.constructPolygonString(building);
				buildingDB.importerId = openStreetMapId;

				await buildingDB.create();
			}
		};	
		
		console.debug('[import] already loaded ' + alreadyLoaded + ' buildings before');

		return buildings;
	}

	async loadWater() {
		let waters =  this.findByTag('water');
		let watersDB: WaterBody[] = [];

		for (let water of waters) {
			let coordinates: Point[] = [];

			if (Array.isArray(water.member)) {
				for (let member of water.member) {
					const way = this.findMember(member);
					
					if (way) {
						coordinates.push(...this.getPoint(way));
					}
				}
			} else {
				coordinates = this.getPoint(water);
			}

			const center = this.calculateCenter(coordinates);
			const polygonString = this.constructPolygonFromPoint(coordinates);

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
		const highways = this.findByTag('highway');

		for(let highway of highways) {
			let coordinates: Point[] = this.getPoint(highway);

			for (let coordinate of coordinates) {
				// todo:
			}
		}

		return highways;
	}

	findMember(member) {
		let memberId = member._attributes.ref;
		let searchedWay;

		for (let way of this.ways) {
			if (way._attributes.id == memberId) {
				searchedWay = way;
			}
		}

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
	 */
	constructPolygonString(building): string {
		let buildingNodes = building.nd;
		let buildingCoordinateString: string[] = [];

		if (buildingNodes) {
			if (buildingNodes.length > 1) {
				for (let buildingNode of buildingNodes) {
					buildingCoordinateString.push(this.getPointOfNode(buildingNode._attributes.ref).toString());
				}
			} else {
				buildingCoordinateString.push(this.getPointOfNode(buildingNodes._attributes.ref).toString());
			}
		}

		return buildingCoordinateString.join(';');
	}

	getPointOfNode(id: string): Point {
		const node = this.getNode(id)[0];
		return new Point(+node._attributes.lat, +node._attributes.lon);
	}

	getNode(id: string) {
		const node = this.nodes.filter(element => element._attributes.id === id);

		if (!Array.isArray(node)) {
			console.error('[import] error while gathering unique node. got no element.');
			return null;
		} else if (node.length > 1) {
			console.error('[import] error while gathering unique node. did not get unique node.');
			return null;
		}

		return node;
	}

	/**
	 * returns the 'way' objects which have a tag with the given attribute.
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
	 * returns the coordinates, which form the polygon of the given 'way' object
	 * @param way 
	 * @returns 
	 */
	getPoint(way): Point[] {
		let coordinates: Point[] = [];
		let nodes = way.nd;

		if(nodes) {
			if(nodes.length > 1) {
				for (let buildingNode of nodes) {
					let nodeRef = buildingNode._attributes.ref;
					coordinates.push(this.getPointOfNode(nodeRef));
				}
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
					case 'addr:city':
						city = tag._attributes.v;
						break;
					case 'addr:housenumber':
						houseNumber = tag._attributes.v;
						break;
					case 'addr:postcode':
						postcode = tag._attributes.v;
						break;
					case 'addr:street':
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

	async getMissingAddress(center: Point, buildings: Building[]) {
		const nearestBuilding = this.findNearestBuilding(center, buildings);

		if (nearestBuilding) {
			return nearestBuilding.address;
		}
	}

	findNearestBuilding(center: Point, points: Building[]): Building {
		let minDistance = Infinity;
		let nearestPoint;

		for (let point of points) {
			const distance = this.calculateDistance(center, new Point(point.centerLatitude, point.centerLongitude));

			if (distance !== 0 && distance < minDistance) {
				minDistance = distance;
				nearestPoint = point;
			}
		}

		return nearestPoint;
	}

	calculateDistance(center, point) {
		const latitudeDifference = point.latitude - center.latitude;
		const longitudeDifference = point.longitude - center.longitude;
	
		const distance = Math.sqrt(latitudeDifference * latitudeDifference + longitudeDifference * longitudeDifference);
	
		return distance;
	}

	async isBuildingLoaded(openStreetMapId) {
		const building = await this.database.building.first(building => building.importerId == openStreetMapId);
		return building;
	}

	calculateCenter(points: Point[]) {
		return Rectangle.fromPolygon(points).center;
	}
}
