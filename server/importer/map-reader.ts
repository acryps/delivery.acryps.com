import * as convert from 'xml-js';
import { DbContext} from '../managed/database';
import { LoadingArea } from './loading-area';
import { RailwayImporter } from './elements/railways';
import { BuildingImporter } from './elements/building';
import { WaterBodyImporter } from './elements/waterbody';
import { MapManager } from './map-manager';

export class MapReader {
	constructor(
		private database: DbContext,
		private loadingArea: LoadingArea
	) {}

	async loadMap() {
		const jsonData = await this.readMapFromXml();

		try {
			const map = new MapManager(jsonData);

			console.debug('[import] loading map for loading area around: lat:' + this.loadingArea.center.latitude + ', long:' + this.loadingArea.center.longitude);

			if (map.hasNodes() && map.hasWays()) {
				await new RailwayImporter(this.database, map).import();
				await new BuildingImporter(this.database, this.loadingArea, map).import();
				await new WaterBodyImporter(this.database, this.loadingArea, map).import();
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
}
