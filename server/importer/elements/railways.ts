import { Importer } from ".";
import { Point } from "../../../shared/point";
import { Rectangle } from "../../../shared/rectangle";
import { Railway } from "../../managed/database";
import { MapDocumentNode } from "../map-manager";

export class RailwayImporter extends Importer {
	async import() {
		const existing = await this.database.railway.toArray();
		const added: Railway[] = [];

		for (let way of this.map.findByTag('railway', ['tram', 'rail'])) {
			await this.importRail(way, existing, added);
		}

		console.log(`[import railway] added ${added.length} railways`);
	}

	async importRail(way: MapDocumentNode, existing: Railway[], added: Railway[]) {
		if (existing.find(railway => this.map.findWayById(railway.importerId))) {
			return;
		}

		if (this.map.hasTag(way, 'tunnel')) {
			return;
		}

		const railway = new Railway();
		railway.importerId = way._attributes.id;

		const gauge = this.map.getTag(way, 'gauge');

		if (gauge) {
			railway.gauge = +gauge;
		}

		const path = this.map.getWayPoints(way);
		railway.path = Point.pack(path);

		const boundingBox = Rectangle.fromPolygon(path);
		railway.minLatitude = boundingBox.minLatitude;
		railway.maxLatitude = boundingBox.maxLatitude;
		railway.minLongitude = boundingBox.minLongitude;
		railway.maxLongitude = boundingBox.maxLongitude;

		await railway.create();
		added.push(railway);
	}
}