import { Importer } from ".";
import { Point } from "../../../shared/point";
import { Rectangle } from "../../../shared/rectangle";
import { Building } from "../../managed/database";
import { ImportArea } from "../import-area";

export class BuildingImporter extends Importer {
	importedBuildingImporterIds: string[];

	async import() {
		const importedBuildings = await this.database.building.includeTree({ importerId: true }).toArray();
		this.importedBuildingImporterIds = importedBuildings.map(building => building.importerId);

		const buildings = this.map.findByTag('building');
		console.debug('[import building] loading ' + buildings?.length + ' buildings');

		const skipped = [];
		const added = [];

		for (let source of buildings) {
			let openStreetMapId = source._attributes.id;

			if (this.importedBuildingImporterIds.includes(openStreetMapId)) {
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

		await this.guessMissingAddresses();

		return { skipped, added };
	}

	private async guessMissingAddresses() {
		console.log(`[import building] guessing missing addresses`);
		const radius = ImportArea.size * 2;

		const unaddressedBuildings: Building[] = await this.getLocalBuildingsQuery(radius).where(building => building.address == null).toArray();
		const addressSources: Building[] = await this.getLocalBuildingsQuery(radius).where(building => building.address != null).toArray();

		console.log(`[import building] found ${unaddressedBuildings.length} unaddressed buildings, found ${addressSources.length} address sources`);

		if (addressSources.length == 0) {
			console.warn(`[import] WARNING: could not guess missing addresses!`);
		}
		
		for (let unaddressedBuilding of unaddressedBuildings) {
			const center = new Point(unaddressedBuilding.centerLatitude, unaddressedBuilding.centerLongitude);
			const nearestBuilding = this.findNearestBuilding(center, addressSources);

			if (nearestBuilding?.address) {
				unaddressedBuilding.address = nearestBuilding.address;
				
				await unaddressedBuilding.update();
			}
		}
	}

	private getLocalBuildingsQuery(radius: number) {
		return this.database.building
			.where(building => building.centerLatitude.valueOf() < (this.loadingArea.center.latitude + radius).valueOf())
			.where(building => building.centerLatitude.valueOf() > (this.loadingArea.center.latitude - radius).valueOf())
			.where(building => building.centerLongitude.valueOf() < (this.loadingArea.center.longitude + radius).valueOf())
			.where(building => building.centerLongitude.valueOf() > (this.loadingArea.center.longitude - radius).valueOf());
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
		try {
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

			const address = this.addressFromTags(building.tag);
			return address;
		}
		catch (error) {
			console.error(`[import building] failed to extract address: ${error}`);
			throw new Error(`Failed to extract address: ${error}`);
		}
		
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