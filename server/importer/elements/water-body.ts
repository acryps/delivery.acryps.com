import { Importer } from ".";
import { Point } from "../../../shared/point";
import { Rectangle } from "../../../shared/rectangle";
import { DbContext, WaterBody } from "../../managed/database";

export class WaterBodyImporter extends Importer {
	async import() {
		const existing = await this.database.waterBody.toArray();

		const added = [];
		const skipped = [];

		const waters = this.map.findByTag('water');

		for (let source of waters) {
			if (existing.find(water => water.importerId == source._attributes.id)) {
				skipped.push(source);

				break;
			}

			let path: Point[] = [];

			if (Array.isArray(source.member)) {
				for (let member of source.member) {
					const way = this.map.findMember(member);
					
					if (way) {
						path.push(...this.map.getWayPoints(way));
					}
				}
			} else {
				path = this.map.getWayPoints(source);
			}

			const water = new WaterBody();
			water.importerId = source._attributes.id;
			water.name = this.map.getTag(source, 'name');

			const polygonString = Point.pack(path);
			water.polygon = polygonString;

			const center = Rectangle.fromPolygon(path).center;
			water.centerLatitude = center.latitude;
			water.centerLongitude = center.longitude;

			await water.create();
			added.push(water);
		}

		return { skipped, added };
	}
}