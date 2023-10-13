import { Point } from "../../shared/point";
import { DbContext, Import } from "../managed/database";
import { LoadingArea } from "./loading-area";
import { MapReader } from "./mapreader";

export class AreaLoader {

	constructor(
		private database: DbContext
	){}

	async loadArea(startLocation: Point) {
		const range = LoadingArea.size * 10;

		let sideLength = range/2;
		let importsAroundStart: Import[] = await this.database.import.where(importObject => 
			importObject.centerLatitude.valueOf() < (startLocation.latitude + sideLength).valueOf() && 
			importObject.centerLatitude.valueOf() > (startLocation.latitude - sideLength).valueOf() && 
			importObject.centerLongitude.valueOf() < (startLocation.longitude + sideLength).valueOf() &&
			importObject.centerLongitude.valueOf() > (startLocation.longitude - sideLength).valueOf()
			).toArray();

		let loadingAreasAroundStart: LoadingArea[] = LoadingArea.fromImportsArray(importsAroundStart);

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
			startAreaLoader.loadMap();

			await this.database.import.create(startArea.toImport());
		}

		let areasToLoad: LoadingArea[] = startArea.missingNeighbors(loadingAreasAroundStart);
		console.debug("AREA-LOADER: need to load "+ areasToLoad.length + " areas around start-area");

		await areasToLoad.forEach(async areaToLoad => {
			let areaLoader = new MapReader(this.database, areaToLoad);
			areaLoader.loadMap();

			await this.database.import.create(areaToLoad.toImport());
		});
	}
}