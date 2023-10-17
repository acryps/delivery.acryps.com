import { Point } from "../../shared/point";
import { Rectangle } from "../../shared/rectangle";

export class MapManager {
	nodes;
	ways;
	relations;

	constructor(jsonData) {
		this.nodes = Array.isArray(jsonData.osm.node) ? jsonData.osm.node : [jsonData.osm.node];
		this.ways = Array.isArray(jsonData.osm.way) ? jsonData.osm.way : [jsonData.osm.way];
		this.relations = Array.isArray(jsonData.osm.relation) ? jsonData.osm.relation : [jsonData.osm.relation];
	}

	hasNodes(): boolean {
		return !(this.nodes === null || this.nodes === undefined);
	}

	hasWays(): boolean {
		return !(this.ways === null || this.ways === undefined);
	}

	hasRelations(): boolean {
		return !(this.relations === null || this.relations === undefined);
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