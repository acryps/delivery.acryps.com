import * as convert from "xml-js";
import { Building, DbContext, Import, WaterBody } from "../managed/database";
import { LoadingArea } from "./loading-area";
import { Point } from "../../shared/point";
import { Rectangle } from "../../shared/rectangle";

export class MapReader {
	nodes;
	ways;
	relations;

	constructor(
		private database: DbContext,
		private loadingArea: LoadingArea
	) {}

	async loadMap() {
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
		let map;

		try {
			map = await fetch(mapURL).then(response => response.text())
		} catch (error) {
			console.error(error);
		}

		return map;
	}

	async loadBuildings() {
		let buildings = this.findByTag("building");
		let buildingsDB: Building[] = [];

		for (let building of buildings) {
			let openStreetMapId = building._attributes.id;

			if (!this.isBuildingLoaded(openStreetMapId)) {
				let polygonString = this.constructPolygonString(building);

				let center = this.calculateCenter(this.getPoint(building));
				let address = await this.extractAddress(building);

				let buildingDB = new Building();
				buildingDB.addressReal = true;

				if (!address) {
					address = await this.getMissingAddress(center);
					buildingDB.addressReal = false;
				}

				buildingDB.address = address;
				buildingDB.centerLatitude = center.latitude;
				buildingDB.centerLongitude = center.longitude;
				buildingDB.polygon = polygonString;
				buildingDB.importerId = openStreetMapId;

				buildingsDB.push(buildingDB);

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

	getPointOfNode(id: string) {
		const filteredNodes = this.nodes.filter(element => element._attributes.id === id);

		if(filteredNodes.length > 1) {
			console.error("didn't get unique element");
			return null;
		}

		if(filteredNodes.length == 0) {
			console.error("got no elements");
			return null;
		}

		const node = filteredNodes[0];	

		return new Point(+node._attributes.lat, +node._attributes.lon);
	}

	getNode(id: string) {
		const node = this.nodes.filter(element => element._attributes.id === id);

		if(node === null) {
			console.error("no node returned");
		}

		return node;
	}

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

	getPoint(way) {
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

	constructPolygonString(building) {
		let polygonString = "";
		let buildingNodes = building.nd;

		if(buildingNodes) {
			if(buildingNodes.length > 1) {
				for (let buildingNode of buildingNodes) {
					const nodeRef = buildingNode._attributes.ref;
					const coordinates: Point = this.getPointOfNode(nodeRef);

					polygonString = coordinates.toString() + ";" + polygonString;
				}
			}
			else {
				const nodeRef = buildingNodes._attributes.ref;
				const coordinates: Point = this.getPointOfNode(nodeRef);
				
				polygonString = coordinates.toString() + ";" + polygonString;
			}
		}
		return polygonString;
	}

	async extractAddress(building) {
		let buildingTags = building.tag;
		let city = "";
		let street = "";
		let postcode = "";
		let houseNumber = "";

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

			return `${street} ${houseNumber} ${postcode} ${city}`;
		} else {
			return false;
		}
	}

	async getMissingAddress(center) {
		const buildings: Building[] = await this.database.building.toArray();
		const points = [];

		let address = '';

		for (let building of buildings) {
			points.push({latitude: building.centerLatitude, longitude: building.centerLongitude});
		}

		const nearestPoint = this.findNearestPoint(center, points);

		for (let building of buildings) {
			if (building.centerLatitude == nearestPoint.latitude && building.centerLongitude == nearestPoint.longitude) {
				address = building.address;
			}
		}

		return address;
	}

	findNearestPoint(center, points) {
		let minDistance;
		let nearestPoint;

		for (let point of points) {
			const distance = this.calculateDistance(center, point);

			if (distance < minDistance) {
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
		const buildings: Building[] = await this.database.building.toArray();

		for (let building of buildings) {
			if (building.importerId == openStreetMapId) {
				return true;
			}
		}

		return false;
	}

	calculateCenter(points: Point[]) {
		return Rectangle.fromPolygon(points).center;
	}
}
