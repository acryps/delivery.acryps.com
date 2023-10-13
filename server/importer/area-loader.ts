import { Point } from "../../shared/point";
import { DbContext, Import } from "../managed/database";
import { LoadingArea } from "./loading-area";
import { MapReader } from "./mapreader";

export class AreaLoader {

	constructor(
		private database: DbContext
	){}

	/**
	 * loads the area surrounding the start-location into the database (if not loaded already)
	 * @param startLocation 
	 */
	async loadArea(startLocation: Point) {

		let loadingAreasAroundStart: LoadingArea[] = await this.getSurroundingLoadingAreas(startLocation);

		let startArea: LoadingArea;

		loadingAreasAroundStart.forEach(loadingArea => {
			if(loadingArea.getBoundingBox().contains(startLocation)) {
				startArea = loadingArea;
			}
		});

		if(startArea === null || startArea === undefined) {
			console.debug("AREA-LOADER: need to load start-area");

			startArea = LoadingArea.defineNewArea(startLocation);
			let startAreaLoader = new MapReader(this.database, startArea);

			if(await startAreaLoader.loadMap()) {
				await this.database.import.create(startArea.toImport());
			}
			else {
				console.warn("AREA-LOADER: could not correctly load map");
			}
		}

		let areasToLoad: LoadingArea[] = startArea.missingNeighbors(loadingAreasAroundStart);

		console.debug("AREA-LOADER: need to load "+ areasToLoad.length + " areas around start-area");

		await areasToLoad.forEach(async areaToLoad => {
			let areaLoader = new MapReader(this.database, areaToLoad);

			if(await areaLoader.loadMap()) {
				await this.database.import.create(areaToLoad.toImport());
			}
			else {
				console.warn("AREA-LOADER: could not correctly load map");
			}
		});
	}

	/**
	 * returns the loading-areas surrounding the given location, which are already loaded in the database
	 * @param location 
	 * @returns 
	 */
	private async getSurroundingLoadingAreas(location: Point): Promise<LoadingArea[]> {
		const range = LoadingArea.size * 10;

		let sideLength = range/2;
		let importsSurroundingLocation: Import[] = await this.database.import.where(importObject => 
			importObject.centerLatitude.valueOf() < (location.latitude + sideLength).valueOf() && 
			importObject.centerLatitude.valueOf() > (location.latitude - sideLength).valueOf() && 
			importObject.centerLongitude.valueOf() < (location.longitude + sideLength).valueOf() &&
			importObject.centerLongitude.valueOf() > (location.longitude - sideLength).valueOf()
			).toArray();

		return LoadingArea.fromImportsArray(importsSurroundingLocation);
	}
}