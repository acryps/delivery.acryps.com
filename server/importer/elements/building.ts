import { Importer } from ".";
import { Point } from "../../../shared/point";
import { Rectangle } from "../../../shared/rectangle";
import { Building } from "../../managed/database";
import { ImportArea } from "../import-area";

export class BuildingImporter extends Importer {
	importedBuildingIds: string[];

	async import() {
		const importedBuildings = await this.database.building.includeTree({ id: true }).toArray();
		this.importedBuildingIds = importedBuildings.map(building => building.id);

		console.log('[import building] importing buildings');
		const buildings = this.map.findByTag('building');
		
		console.log('[import building] found ' + buildings.length + ' buildings');

		const skipped = [];
		const added = [];

		for (let source of buildings) {
			let openStreetMapId = source._attributes.id;

			if (this.importedBuildingIds.includes(openStreetMapId)) {
				skipped.push(source);
			} else {
				const building = new Building();
				building.importerId = openStreetMapId;

				const polygon = this.map.getWayPoints(source);
				building.polygon = Point.pack(polygon);

				const center = Rectangle.fromPolygon(polygon).center;
				building.centerLatitude = center.latitude;
				building.centerLongitude = center.longitude;

				const address = await this.extractAddress(source);
				building.addressReal = !!address;
				building.address = address;

				await building.create();
				
				added.push(building);
			}
		};

		this.guessMissingAddresses();

		return { skipped, added };
	}

	private async guessMissingAddresses() {
		const radius = ImportArea.size * 2;

		const localBuildingsQuery = this.database.building
			.where(building => building.centerLatitude.valueOf() < (this.loadingArea.center.latitude + radius).valueOf())
			.where(building => building.centerLatitude.valueOf() > (this.loadingArea.center.latitude - radius).valueOf())
			.where(building => building.centerLongitude.valueOf() < (this.loadingArea.center.longitude + radius).valueOf())
			.where(building => building.centerLongitude.valueOf() > (this.loadingArea.center.longitude - radius).valueOf());

		const unaddressedBuildings: Building[] = await localBuildingsQuery.where(building => building.address == null).toArray();
		const addressSources: Building[] = await localBuildingsQuery.where(building => building.address == null).toArray();
		
		for (let unaddressedBuilding of unaddressedBuildings) {
			const center = new Point(unaddressedBuilding.centerLatitude, unaddressedBuilding.centerLongitude);
			const nearestBuilding = this.findNearestBuilding(center, addressSources);

			if (nearestBuilding?.address) {
				unaddressedBuilding.address = nearestBuilding.address;
				
				await unaddressedBuilding.update();
			}
		}
	}

	private findNearestBuilding(origin: Point, buildings: Building[]): Building {
		let minimumDistance = Infinity;
		let closestBuilding: Building;

		for (let building of buildings) {
			const center = new Point(building.centerLatitude, building.centerLongitude);
			const distance = center.distance(origin);

			if (distance < minimumDistance) {
				minimumDistance = distance;
				closestBuilding = building;
			}
		}

		return closestBuilding;
	}

	private async extractAddress(building) {
		let buildingNodes = building.nd;

		if (buildingNodes) {
			buildingNodes = Array.isArray(buildingNodes) ? buildingNodes : [buildingNodes];

			for (let buildingNode of buildingNodes) {
				let buildingNodeTags = this.map.findNodeById(buildingNode._attributes.ref).tag;
				let address = this.addressFromTags(buildingNodeTags);

				if (address) {
					return address;
				}
			}
		}

		return this.addressFromTags(building.tag);
	}

	private addressFromTags(tags): string {
		if (Array.isArray(tags)) {
			let city;
			let street;
			let postcode;
			let houseNumber;

			for (let tag of tags) {
				switch (tag._attributes.k) {
					case 'addr:city':
						city = tag._attributes.v;
						break;
					case 'addr:housenumber':
						houseNumber = tag._attributes.v;
						break;
					case 'addr:postcode':
						postcode = tag._attributes.v;
						break;
					case 'addr:street':
						street = tag._attributes.v;
						break;
					default:
						break;
				}
			}

			if (city && houseNumber && postcode && street) {
				return `${street} ${houseNumber}\n${postcode} ${city}`;
			}
			
			if (street && houseNumber) {
				return `${street} ${houseNumber}`;
			}
		}

		return;
	}
}