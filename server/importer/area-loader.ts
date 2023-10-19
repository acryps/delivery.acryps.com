import { Point } from '../../shared/point';
import { DbContext, Import } from '../managed/database';
import { ImportArea } from './import-area';
import { MapReader } from './map-reader';

export class AreaLoader {
	constructor(
		private database: DbContext
	) {}

	/**
	 * loads the area surrounding the start-location into the database (if not loaded already)
	 */
	async importArea(location: Point) {
		const importedNeighbors: ImportArea[] = await this.getNeighboringImportAreas(location);
		let center = importedNeighbors.find(area => area.getBoundingBox().contains(location));

		if (!center) {
			console.log(`[import] need to load area at ${location}`);
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
		console.debug(`[import] need to load ${missingNeighbors.length} areas around start-area`);

		for (let missingNeighbor of missingNeighbors) {
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
	 * @param location 
	 * @returns 
	 */
	private async getNeighboringImportAreas(location: Point) {
		const range = ImportArea.size * (1 + ImportArea.neighborhoodExtent * 2);
		const sideLength = range / 2;

		const neighboringImports = await this.database.import
			.where(area => area.centerLatitude.valueOf() < (location.latitude + sideLength).valueOf())
			.where(area => area.centerLatitude.valueOf() > (location.latitude - sideLength).valueOf())
			.where(area => area.centerLongitude.valueOf() < (location.longitude + sideLength).valueOf())
			.where(area => area.centerLongitude.valueOf() > (location.longitude - sideLength).valueOf())
			.toArray();

		return neighboringImports.map(neighbor => new ImportArea(new Point(neighbor.centerLatitude, neighbor.centerLongitude)));
	}
}