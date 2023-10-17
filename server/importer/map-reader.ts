import * as convert from 'xml-js';
import { Building, DbContext, Import, WaterBody } from '../managed/database';
import { LoadingArea } from './loading-area';
import { Point } from '../../shared/point';
import { Rectangle } from '../../shared/rectangle';
import { RailwayImporter } from './railways';
import { BuildingImporter } from './building-importer';
import { WaterBodyImporter } from './waterbody-importer';

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

		try {
			this.nodes = Array.isArray(jsonData.osm.node) ? jsonData.osm.node : [jsonData.osm.node];
			this.ways = Array.isArray(jsonData.osm.way) ? jsonData.osm.way : [jsonData.osm.way];
			this.relations = Array.isArray(jsonData.osm.relation) ? jsonData.osm.relation : [jsonData.osm.relation];
		
			console.debug('[import] loading map for loading area around: lat:' + this.loadingArea.center.latitude + ', long:' + this.loadingArea.center.longitude);

			if (this.nodes && this.ways) {
				await new RailwayImporter(this.database, this.nodes).import(this.findByTag('railway'));
				await new BuildingImporter(this.database, this.loadingArea, this.nodes, this.ways, this.relations).import();
				await new WaterBodyImporter(this.database, this.loadingArea, this.nodes, this.ways, this.relations).import();
			}

		} catch (error) {
			console.error('[import] could not load data: ' + error);
			return false;
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
