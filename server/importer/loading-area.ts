import { Point } from "../../shared/point";
import { Rectangle } from "../../shared/rectangle";
import { Import } from "../managed/database";

export class LoadingArea {
	static size: number = 0.005;
	center: Point;
	neighborCenters: Point[];

	constructor(center: Point) {
		this.center = center;

		this.neighborCenters = [
			new Point(LoadingArea.scaler(this.center.latitude + (LoadingArea.size)), LoadingArea.scaler(this.center.longitude)),
			new Point(LoadingArea.scaler(this.center.latitude - (LoadingArea.size)), LoadingArea.scaler(this.center.longitude)),
			new Point(LoadingArea.scaler(this.center.latitude), LoadingArea.scaler(this.center.longitude + (LoadingArea.size))),
			new Point(LoadingArea.scaler(this.center.latitude), LoadingArea.scaler(this.center.longitude - (LoadingArea.size))),
			new Point(LoadingArea.scaler(this.center.latitude + (LoadingArea.size)), LoadingArea.scaler(this.center.longitude + (LoadingArea.size))),
			new Point(LoadingArea.scaler(this.center.latitude - (LoadingArea.size)), LoadingArea.scaler(this.center.longitude + (LoadingArea.size))),
			new Point(LoadingArea.scaler(this.center.latitude + (LoadingArea.size)), LoadingArea.scaler(this.center.longitude - (LoadingArea.size))),
			new Point(LoadingArea.scaler(this.center.latitude - (LoadingArea.size)), LoadingArea.scaler(this.center.longitude - (LoadingArea.size))),
		]
	}
	
	missingNeighbors(loadingAreas: LoadingArea[]): LoadingArea[] {
		let loadedLoadingAreas: boolean[] = new Array(8).fill(false);
		let notLoadedNeighbors: LoadingArea[] = [];

		loadingAreas.forEach(loadingArea => {
			for(let i = 0; i < this.neighborCenters.length; i++) {
				if(loadingArea.center.latitude === this.neighborCenters[i].latitude && loadingArea.center.longitude === this.neighborCenters[i].longitude)
					loadedLoadingAreas[i] = true;
				}
		});
		
		for(let i = 0; i < this.neighborCenters.length; i++) {
			if(loadedLoadingAreas[i] == false) {
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
		let roundedLatitude = Math.round((startLocation.latitude / this.size)) * this.size;
		let roundedLongitude = Math.round((startLocation.longitude / this.size)) * this.size;

		return new LoadingArea(new Point(this.scaler(roundedLatitude), this.scaler(roundedLongitude)));
	}

	private static scaler(number: number): number {
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