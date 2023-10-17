import { Point } from "../../shared/point";
import { Rectangle } from "../../shared/rectangle";
import { DbContext, Railway } from "../managed/database";
import { MapManager } from "./map-manager";

export class RailwayImporter {
	allowedClasses = ['tram', 'rail'];

	constructor(
		private database: DbContext,
		private map: MapManager
	) {}

	async import() {
		const ways = this.map.findByTag('railway');
		const existing = await this.database.railway.toArray();
		const added: Railway[] = [];

		for (let way of ways) {
			await this.importRail(way, existing, added);
		}

		console.log(`[import railway] added ${added.length} railways`);
	}

	async importRail(way, existing: Railway[], added: Railway[]) {
		if (!Array.isArray(way.tag)) {
			return;
		}

		if (existing.find(railway => railway.importerId == way._attributes.id)) {
			console.debug('existed');

			return;
		}

		const type = way.tag.find(tag => tag._attributes.k == 'railway')?._attributes.v;

		if (!this.allowedClasses.includes(type)) {
			console.debug('had illegal type', type);

			return;
		}

		if (way.tag.find(tag => tag._attributes.k == 'tunnel')) {
			console.debug('had tunnel');

			return;
		}

		const railway = new Railway();
		railway.importerId = way._attributes.id;
		railway.gauge = way.tag.find(tag => tag._attributes.k == 'gauge')?._attributes.v;

		const points: Point[] = [];

		for (let reference of way.nd) {
			const node = this.map.nodes.find(node => node._attributes.id == reference._attributes.ref);

			points.push(new Point(+node._attributes.lat, +node._attributes.lon));
		}

		railway.path = points.map(point => `${point.latitude},${point.longitude}`).join(';');

		const boundingBox = Rectangle.fromPolygon(points);
		railway.minLatitude = boundingBox.minLatitude;
		railway.maxLatitude = boundingBox.maxLatitude;
		railway.minLongitude = boundingBox.minLongitude;
		railway.maxLongitude = boundingBox.maxLongitude;

		await railway.create();
		added.push(railway);
	}
}