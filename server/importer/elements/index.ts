import { DbContext } from "../../managed/database";
import { ImportArea } from "../import-area";
import { MapDocument } from "../map-manager";

export class Importer {
	constructor(
		protected database: DbContext,
		protected loadingArea: ImportArea,
		protected map: MapDocument
	) {}

	async import() {
		throw new Error(`No importer defined`);
	}
}