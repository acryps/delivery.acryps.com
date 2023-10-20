import { Point } from '../../shared/point';
import { DbContext, Import } from '../managed/database';
import { ImportArea } from './import-area';
import { MapReader } from './map-reader';

export class Importer {
	constructor(
		private database: DbContext
	) {}

	/**
	 * imports the area surrounding the start-location into the database (if not loaded already)
	 */
	async import(location: Point) {
		console.log(`[import] STARTING IMPORT:`)
		console.log(`[import] importing area around location ${location}, clamp location to ${ImportArea.clampPointToArea(location)}`);
		location = ImportArea.clampPointToArea(location);
		const importedNeighbors: ImportArea[] = await this.getNeighboringImportAreas(location);
		let center = importedNeighbors.find(area => area.getBoundingBox().contains(location));

		if (!center) {
			console.log(`[import] need to load start-area at ${location}`);
			center = new ImportArea(location);

			try {
				const startAreaLoader = new MapReader(this.database, center);

				await startAreaLoader.import();
			} catch (error) {
				console.warn(`[import] could not import map ${location}`, error);

				throw new Error(`Could not import map for ${location}`);
			}
		}

		const missingNeighbors: ImportArea[] = center.findMissingNeighbors(importedNeighbors);
		console.log(`[import] need to load ${missingNeighbors.length} areas around start-area`);

		for (let missingNeighbor of missingNeighbors) {
			console.log('[import] loading missing neighbor: ' + missingNeighbor.center);
			const reader = new MapReader(this.database, missingNeighbor);

			// load missing neighbor in background to reduce loading speed
			// this might not load all buildings visible outside the games map, which does not impact gameplay
			reader.import().catch(error => {
				console.warn(`[import] could not load map: ${error}`);
			});
		}
	}

	/**
	 * returns the loading-areas surrounding the given location, which are already loaded in the database
	 */
	private async getNeighboringImportAreas(location: Point) {
		const range = ImportArea.size * (1 + ImportArea.neighborhoodExtent * 2);
		const sideLength = range / 2;

		console.log(`[import] searching for imported neighbors in range lat = [${(location.latitude - sideLength)}, ${location.latitude + sideLength}], long = [${(location.longitude - sideLength)}, ${location.longitude + sideLength}]`);

		const neighboringImports = await this.database.import
			.where(area => area.centerLatitude.valueOf() < (location.latitude + sideLength).valueOf())
			.where(area => area.centerLatitude.valueOf() > (location.latitude - sideLength).valueOf())
			.where(area => area.centerLongitude.valueOf() < (location.longitude + sideLength).valueOf())
			.where(area => area.centerLongitude.valueOf() > (location.longitude - sideLength).valueOf())
			.toArray();

		console.log(`[import] found ${neighboringImports.length} imported areas around location ${location}`);

		return neighboringImports.map(neighbor => new ImportArea(new Point(neighbor.centerLatitude, neighbor.centerLongitude)));
	}
}