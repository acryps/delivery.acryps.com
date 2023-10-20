import * as convert from 'xml-js';
import { DbContext} from '../managed/database';
import { ImportArea } from './import-area';
import { RailwayImporter } from './elements/railways';
import { BuildingImporter } from './elements/building';
import { WaterBodyImporter } from './elements/water-body';
import { MapDocument } from './map-document';

export class MapReader {
	static importers = [
		BuildingImporter,
		RailwayImporter,
		WaterBodyImporter
	];

	constructor(
		private database: DbContext,
		private area: ImportArea
	) {}

	async import() {
		try {
			const sourceXml = await this.download();
			const source = JSON.parse(convert.xml2json(sourceXml, { compact: true }));
			
			const map = new MapDocument(source);

			if (!map.empty) {
				for (let importer of MapReader.importers) {
					console.log(`[import] importing '${importer.name}'...`);
					const result = await new importer(this.database, this.area, map).import();

					console.log(`[import] imported '${importer.name}', added ${result.added.length}, skipped ${result.skipped.length}`);
				}
			}

			await this.database.import.create(this.area.toImport());
		} catch (error) {
			console.error(`[import] could not import map ${this.area.center}: ${error}`);

			throw new Error(`Could not import map: ${error}`);
		}
	}

	async download() {
		const boundingBox = this.area.getBoundingBox();

		const source = process.env.IMPORT_SOURCE
			.replace('${min-latitude}', boundingBox.minLatitude.toString())
			.replace('${min-longitude}', boundingBox.minLongitude.toString())
			.replace('${max-latitude}', boundingBox.maxLatitude.toString())
			.replace('${max-longitude}', boundingBox.maxLongitude.toString());
		
		console.log(`[import] downloading map from '${source}'`);
		
		try {
			return await fetch(source).then(response => response.text());
		} catch (error) {
			console.warn(`[import] could not download map from '${source}'`, error);

			throw new Error(`Could not download map: ${error}`);
		}
	}
}
