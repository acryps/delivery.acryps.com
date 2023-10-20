import { DbContext } from "../../managed/database";
import { ImportArea } from "../import-area";
import { MapDocument } from "../map-document";

export class Importer {
	constructor(
		protected database: DbContext,
		protected loadingArea: ImportArea,
		protected map: MapDocument
	) {}

	async import(): Promise<{ skipped: any[], added: any[] }> {
		throw new Error(`No importer defined`);
	}
}