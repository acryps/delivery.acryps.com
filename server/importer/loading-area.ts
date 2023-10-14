import { Point } from "../../shared/point";
import { Rectangle } from "../../shared/rectangle";
import { Import } from "../managed/database";

export class LoadingArea {
	// defines the fixed size of the loading-areas
	static size: number = 0.002;

	// the centers of the 8 neighbors of a loading-area
	neighborCenters: Point[];

	constructor(public center: Point) {
		this.neighborCenters = [
			new Point(LoadingArea.toFixedFloat(this.center.latitude + (LoadingArea.size)), LoadingArea.toFixedFloat(this.center.longitude)),
			new Point(LoadingArea.toFixedFloat(this.center.latitude - (LoadingArea.size)), LoadingArea.toFixedFloat(this.center.longitude)),
			new Point(LoadingArea.toFixedFloat(this.center.latitude), LoadingArea.toFixedFloat(this.center.longitude + (LoadingArea.size))),
			new Point(LoadingArea.toFixedFloat(this.center.latitude), LoadingArea.toFixedFloat(this.center.longitude - (LoadingArea.size))),
			new Point(LoadingArea.toFixedFloat(this.center.latitude + (LoadingArea.size)), LoadingArea.toFixedFloat(this.center.longitude + (LoadingArea.size))),
			new Point(LoadingArea.toFixedFloat(this.center.latitude - (LoadingArea.size)), LoadingArea.toFixedFloat(this.center.longitude + (LoadingArea.size))),
			new Point(LoadingArea.toFixedFloat(this.center.latitude + (LoadingArea.size)), LoadingArea.toFixedFloat(this.center.longitude - (LoadingArea.size))),
			new Point(LoadingArea.toFixedFloat(this.center.latitude - (LoadingArea.size)), LoadingArea.toFixedFloat(this.center.longitude - (LoadingArea.size))),
		]
	}
	
	/**
	 * returns all neighbors which are missing in the given set of loading-areas
	 * @param loadingAreas 
	 * @returns 
	 */
	missingNeighbors(loadingAreas: LoadingArea[]): LoadingArea[] {
		let loadedLoadingAreas: boolean[] = new Array(8).fill(false);
		let notLoadedNeighbors: LoadingArea[] = [];

		loadingAreas.forEach(loadingArea => {
			for (let i = 0; i < this.neighborCenters.length; i++) {
				if (loadingArea.center.latitude === this.neighborCenters[i].latitude && loadingArea.center.longitude === this.neighborCenters[i].longitude)
					loadedLoadingAreas[i] = true;
				}
		});
		
		for (let i = 0; i < this.neighborCenters.length; i++) {
			if (loadedLoadingAreas[i] == false) {
				let newLoadingArea = new LoadingArea(new Point(this.neighborCenters[i].latitude, this.neighborCenters[i].longitude));
				notLoadedNeighbors.push(newLoadingArea);
			}
		}		

		return notLoadedNeighbors;
	}

	getBoundingBox(): Rectangle {
		return Rectangle.fromCenter(this.center, LoadingArea.size, LoadingArea.size);
	}

	static defineNewArea(startLocation: Point): LoadingArea {
		//the central point must be a multiple of [this.size]
		let roundedLatitude = Math.round((startLocation.latitude / this.size)) * this.size;
		let roundedLongitude = Math.round((startLocation.longitude / this.size)) * this.size;

		return new LoadingArea(new Point(this.toFixedFloat(roundedLatitude), this.toFixedFloat(roundedLongitude)));
	}

	private static toFixedFloat(number: number): number {
		return parseFloat(number.toFixed(4));
	}

	static fromImport(importArea: Import): LoadingArea {
		return new LoadingArea(new Point(importArea.centerLatitude, importArea.centerLongitude));
	}

	static fromImportsArray(importAreas: Import[]): LoadingArea[] {
		let loadingAreas: LoadingArea[] = [];
		importAreas.forEach(importArea => {
			loadingAreas.push(this.fromImport(importArea));
		});
		return loadingAreas;
	}

	toImport(): Import {
		let importObject = new Import();
		importObject.created = new Date();
		importObject.centerLatitude = this.center.latitude;
		importObject.centerLongitude = this.center.longitude;

		let boundingBox = this.getBoundingBox();
		importObject.maxLatitude = boundingBox.maxLatitude;
		importObject.minLatitude = boundingBox.minLatitude;
		importObject.maxLongitude = boundingBox.maxLongitude;
		importObject.minLongitude = boundingBox.minLatitude;

		return importObject;
	}
}