import { Point } from "../../shared/point";
import { Rectangle } from "../../shared/rectangle";
import { Building, DbContext } from "../managed/database";
import { LoadingArea } from "./loading-area";

export class BuildingImporter {
	constructor(
		private database: DbContext,
		private loadingArea: LoadingArea,
		private nodes,
		private ways,
		private relations
	) { }

	async import() {
		await this.saveBuildings();
		this.guessMissingAddresses();
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
	}

	/**
	* constructs a string containing latitude and longitude which define the polygon of a building.
	* the constructed polygonstring has the following format: [latitude], [longitude] ; [latitude], [longitude] ; ...
	*/
	private constructPolygonString(building): string {
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

	private async guessMissingAddresses() {
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

	private async isBuildingLoaded(openStreetMapId) {
		const building = await this.database.building.first(building => building.importerId == openStreetMapId);
		return building;
	}

	private async getMissingAddress(center: Point, buildings: Building[]) {
		const nearestBuilding = this.findNearestBuilding(center, buildings);

		if (nearestBuilding) {
			return nearestBuilding.address;
		}
	}

	private findNearestBuilding(center: Point, points: Building[]): Building {
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

	private calculateDistance(center, point) {
		const latitudeDifference = point.latitude - center.latitude;
		const longitudeDifference = point.longitude - center.longitude;
	
		const distance = Math.sqrt(latitudeDifference * latitudeDifference + longitudeDifference * longitudeDifference);
	
		return distance;
	}

	private calculateCenter(points: Point[]) {
		return Rectangle.fromPolygon(points).center;
	}

	private async extractAddress(building) {
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

	private addressFromTags(tags): string {
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
}