import { Point } from "../../shared/point";
import { Rectangle } from "../../shared/rectangle";

export type MapDocumentNode = {
	[name: string]: MapDocumentNode | MapDocumentNode[];
} & {
	_attributes: Record<string, string>
};

export class MapDocument {
	nodes: MapDocumentNode | MapDocumentNode[];
	ways: MapDocumentNode | MapDocumentNode[];
	relations: MapDocumentNode | MapDocumentNode[];

	constructor(source) {
		this.nodes = Array.isArray(source.osm.node) ? source.osm.node : [source.osm.node];
		this.ways = Array.isArray(source.osm.way) ? source.osm.way : [source.osm.way];
		this.relations = Array.isArray(source.osm.relation) ? source.osm.relation : [source.osm.relation];
	}

	get empty() {
		return !this.hasNodes() && !this.hasWays();
	}

	hasNodes(): boolean {
		return !this.nodes;
	}

	hasWays(): boolean {
		return !this.ways;
	}

	hasRelations(): boolean {
		return !this.relations;
	}

	findMember(member) {
		const memberId = member._attributes.ref;

		if (Array.isArray(this.ways)) {
			for (let way of this.ways) {
				if (way._attributes.id == memberId) {
					return way;
				}
			}
		}
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