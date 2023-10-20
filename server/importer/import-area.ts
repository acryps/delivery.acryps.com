import { Point } from '../../shared/point';
import { Rectangle } from '../../shared/rectangle';
import { Import } from '../managed/database';

export class ImportArea {
	static readonly size = 0.005;
	static readonly neighborhoodExtent = 1; // how many tiles we should go up / left / right / down

	center: Point;

	constructor(center: Point) {
		this.center = ImportArea.clampPointToArea(center);
	}
	
	/**
	 * returns all neighbors which are missing in the given set of loading-areas
	 */
	findMissingNeighbors(importedAreas: ImportArea[]) {
		let missingNeighbors: ImportArea[] = [];
		let neighbors: string[] = [];

		for (let latitudeIndex = -ImportArea.neighborhoodExtent; latitudeIndex <= ImportArea.neighborhoodExtent; latitudeIndex++) {
			for (let longitudeIndex = -ImportArea.neighborhoodExtent; longitudeIndex <= ImportArea.neighborhoodExtent; longitudeIndex++) {
				if (latitudeIndex != 0 || longitudeIndex != 0) {
					const requiredNeighbor = ImportArea.clampPointToArea(new Point(this.center.latitude + ImportArea.size * latitudeIndex, this.center.longitude + ImportArea.size * longitudeIndex));
					neighbors.push(requiredNeighbor.toString());

					const existingImport = importedAreas.find(importedArea => requiredNeighbor.latitude == importedArea.center.latitude && requiredNeighbor.longitude == importedArea.center.longitude);
			
					if (!existingImport) {
						missingNeighbors.push(new ImportArea(requiredNeighbor));
					}
				}
			}
		}

		console.log(`[import area] center ${this.center} with neighbors: ${neighbors.join('; ')}`);

		return missingNeighbors;
	}

	getBoundingBox(): Rectangle {
		return Rectangle.fromCenter(this.center, ImportArea.size, ImportArea.size);
	}

	static clampPointToArea(point: Point) {
		const length = this.size.toString().length - 2;

		return new Point(
			parseFloat((Math.round((point.latitude / this.size)) * this.size).toFixed(length)),
			parseFloat((Math.round((point.longitude / this.size)) * this.size).toFixed(length))
		);
	}

	toImport(): Import {
		let area = new Import();
		area.created = new Date();
		area.centerLatitude = this.center.latitude;
		area.centerLongitude = this.center.longitude;

		const boundingBox = this.getBoundingBox();
		area.maxLatitude = boundingBox.maxLatitude;
		area.minLatitude = boundingBox.minLatitude;
		area.maxLongitude = boundingBox.maxLongitude;
		area.minLongitude = boundingBox.minLatitude;

		return area;
	}
}