import { Point } from "../../shared/point";
import { Rectangle } from "../../shared/rectangle";
import { DbContext, WaterBody } from "../managed/database";
import { LoadingArea } from "./loading-area";

export class WaterBodyImporter {
	constructor(
		private database: DbContext,
		private loadingArea: LoadingArea,
		private nodes,
		private ways,
		private relations
	) { }

	async import() {
		await this.loadWater();
	}

	private async loadWater() {
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

	calculateCenter(points: Point[]) {
		return Rectangle.fromPolygon(points).center;
	}

}