import { Point } from "../../shared/point";
import { DbContext, WaterBody } from "../managed/database";
import { LoadingArea } from "./loading-area";
import { MapManager } from "./map-manager";

export class WaterBodyImporter {
	constructor(
		private database: DbContext,
		private loadingArea: LoadingArea,
		private map: MapManager
	) { }

	async import() {
		await this.loadWater();
	}

	private async loadWater() {
		let waters =  this.map.findByTag('water');
		let watersDB: WaterBody[] = [];

		for (let water of waters) {
			let coordinates: Point[] = [];

			if (Array.isArray(water.member)) {
				for (let member of water.member) {
					const way = this.map.findMember(member);
					
					if (way) {
						coordinates.push(...this.map.getPoint(way));
					}
				}
			} else {
				coordinates = this.map.getPoint(water);
			}

			const center = this.map.calculateCenter(coordinates);
			const polygonString = this.map.constructPolygonFromPoint(coordinates);

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
}