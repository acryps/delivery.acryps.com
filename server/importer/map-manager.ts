import { Point } from "../../shared/point";
import { Rectangle } from "../../shared/rectangle";

export type MapDocumentNode = {
	[name: string]: MapDocumentNode | MapDocumentNode[];
} & {
	_attributes: Record<string, string>
};

export class MapDocument {
	private nodes: MapDocumentNode[];
	private ways: MapDocumentNode[];
	private relations: MapDocumentNode[];

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

		for (let way of this.ways) {
			if (way._attributes.id == memberId) {
				return way;
			}
		}
	}

	findNodeById(id: string) {
		const node = this.nodes.filter(element => element._attributes.id === id);

		if (node.length) {
			throw new Error(`Node '${id}' not found`);
		}
		
		if (node.length > 1) {
			throw new Error(`Node '${id}' found multiple times`);
		}

		return node[0];
	}

	findWayById(id: string) {
		const way = this.ways.filter(element => element._attributes.id === id);

		if (way.length) {
			throw new Error(`Way '${id}' not found`);
		}
		
		if (way.length > 1) {
			throw new Error(`Way '${id}' found multiple times`);
		}

		return way[0];
	}

	getNodePoint(node: MapDocumentNode) {
		return new Point(+node._attributes.lat, +node._attributes.lon);
	}

	findByTag(attribute: string, allowedClasses?: string[]) {
		const filtered: MapDocumentNode[] = [];

		for (let item of [...this.ways, ...this.relations]) {
			if (item && item.tag) {
				const tags = Array.isArray(item.tag) ? item.tag : [item.tag];

				for (let tag of tags) {
					if (tag._attributes.k == attribute) {
						if (allowedClasses) {
							if (allowedClasses.includes(tag._attributes.v)) {
								filtered.push(item);
							}
						} else {
							filtered.push(item);
						}
					}
				}
			}
		}

		return Array.isArray(filtered) ? filtered : [filtered];
	}

	getWayPoints(way: MapDocumentNode): Point[] {
		let points: Point[] = [];
		let nodeReferences = way.nd;

		if (Array.isArray(nodeReferences)) {
			for (let nodeReference of nodeReferences) {
				const node = this.findNodeById(nodeReference._attributes.ref);

				points.push(this.getNodePoint(node));
			}
		} else {
			const node = this.findNodeById(nodeReferences._attributes.ref);

			points.push(this.getNodePoint(node));
		}

		return points;
	}

	getTag(item: MapDocumentNode, name: string) {
		const tags = Array.isArray(item.tag) ? item.tag : [item.tag];

		return tags.find(tag => tag._attributes.k == name)?._attributes.v;
	}

	hasTag(item: MapDocumentNode, name: string) {
		return this.getTag(item, name) !== undefined;
	}
}