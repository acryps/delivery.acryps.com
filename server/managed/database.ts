import { Entity, DbSet, RunContext, QueryUUID, QueryProxy, QueryString, QueryJSON, QueryTimeStamp, QueryNumber, QueryTime, QueryDate, QueryBoolean, QueryBuffer, QueryEnum, ForeignReference, PrimaryReference, View, ViewSet } from "vlquery";

export class StreetQueryProxy extends QueryProxy {
	get centerLatitude(): Partial<QueryNumber> { throw new Error("Invalid use of QueryModels. QueryModels cannot be used during runtime"); }
	get centerLongitude(): Partial<QueryNumber> { throw new Error("Invalid use of QueryModels. QueryModels cannot be used during runtime"); }
	get polygon(): Partial<QueryString> { throw new Error("Invalid use of QueryModels. QueryModels cannot be used during runtime"); }
	get name(): Partial<QueryString> { throw new Error("Invalid use of QueryModels. QueryModels cannot be used during runtime"); }
}

export class Street extends Entity<StreetQueryProxy> {
	declare id: string;
	centerLatitude: number;
	centerLongitude: number;
	polygon: string;
	name: string;
	

	$$meta = {
		source: "street",

		columns: {
			id: { type: "uuid", name: "id" },
			centerLatitude: { type: "float4", name: "center_latitude" },
			centerLongitude: { type: "float4", name: "center_longitude" },
			polygon: { type: "text", name: "polygon" },
			name: { type: "text", name: "name" }
		},

		get set(): DbSet<Street, StreetQueryProxy> { 
			return new DbSet<Street, StreetQueryProxy>(Street, null);
		}
	};
}
			
export class BuildingQueryProxy extends QueryProxy {
	get centerLatitude(): Partial<QueryNumber> { throw new Error("Invalid use of QueryModels. QueryModels cannot be used during runtime"); }
	get centerLongitude(): Partial<QueryNumber> { throw new Error("Invalid use of QueryModels. QueryModels cannot be used during runtime"); }
	get addressReal(): Partial<QueryBoolean> { throw new Error("Invalid use of QueryModels. QueryModels cannot be used during runtime"); }
	get polygon(): Partial<QueryString> { throw new Error("Invalid use of QueryModels. QueryModels cannot be used during runtime"); }
	get address(): Partial<QueryString> { throw new Error("Invalid use of QueryModels. QueryModels cannot be used during runtime"); }
	get importerId(): Partial<QueryString> { throw new Error("Invalid use of QueryModels. QueryModels cannot be used during runtime"); }
}

export class Building extends Entity<BuildingQueryProxy> {
	centerLatitude: number;
	centerLongitude: number;
	addressReal: boolean;
	declare id: string;
	polygon: string;
	address: string;
	importerId: string;
	

	$$meta = {
		source: "building",

		columns: {
			centerLatitude: { type: "float4", name: "center_latitude" },
			centerLongitude: { type: "float4", name: "center_longitude" },
			addressReal: { type: "bool", name: "address_real" },
			id: { type: "uuid", name: "id" },
			polygon: { type: "text", name: "polygon" },
			address: { type: "text", name: "address" },
			importerId: { type: "text", name: "importer_id" }
		},

		get set(): DbSet<Building, BuildingQueryProxy> { 
			return new DbSet<Building, BuildingQueryProxy>(Building, null);
		}
	};
}
			
export class WaterBodyQueryProxy extends QueryProxy {
	get centerLatitude(): Partial<QueryNumber> { throw new Error("Invalid use of QueryModels. QueryModels cannot be used during runtime"); }
	get centerLongitude(): Partial<QueryNumber> { throw new Error("Invalid use of QueryModels. QueryModels cannot be used during runtime"); }
	get polygon(): Partial<QueryString> { throw new Error("Invalid use of QueryModels. QueryModels cannot be used during runtime"); }
	get name(): Partial<QueryString> { throw new Error("Invalid use of QueryModels. QueryModels cannot be used during runtime"); }
	get importerId(): Partial<QueryString> { throw new Error("Invalid use of QueryModels. QueryModels cannot be used during runtime"); }
}

export class WaterBody extends Entity<WaterBodyQueryProxy> {
	declare id: string;
	centerLatitude: number;
	centerLongitude: number;
	polygon: string;
	name: string;
	importerId: string;
	

	$$meta = {
		source: "water_body",

		columns: {
			id: { type: "uuid", name: "id" },
			centerLatitude: { type: "float4", name: "center_latitude" },
			centerLongitude: { type: "float4", name: "center_longitude" },
			polygon: { type: "text", name: "polygon" },
			name: { type: "text", name: "name" },
			importerId: { type: "text", name: "importer_id" }
		},

		get set(): DbSet<WaterBody, WaterBodyQueryProxy> { 
			return new DbSet<WaterBody, WaterBodyQueryProxy>(WaterBody, null);
		}
	};
}
			
export class RailwayQueryProxy extends QueryProxy {
	get minLatitude(): Partial<QueryNumber> { throw new Error("Invalid use of QueryModels. QueryModels cannot be used during runtime"); }
	get maxLatitude(): Partial<QueryNumber> { throw new Error("Invalid use of QueryModels. QueryModels cannot be used during runtime"); }
	get minLongitude(): Partial<QueryNumber> { throw new Error("Invalid use of QueryModels. QueryModels cannot be used during runtime"); }
	get maxLongitude(): Partial<QueryNumber> { throw new Error("Invalid use of QueryModels. QueryModels cannot be used during runtime"); }
	get gauge(): Partial<QueryNumber> { throw new Error("Invalid use of QueryModels. QueryModels cannot be used during runtime"); }
	get importerId(): Partial<QueryString> { throw new Error("Invalid use of QueryModels. QueryModels cannot be used during runtime"); }
	get path(): Partial<QueryString> { throw new Error("Invalid use of QueryModels. QueryModels cannot be used during runtime"); }
}

export class Railway extends Entity<RailwayQueryProxy> {
	declare id: string;
	minLatitude: number;
	maxLatitude: number;
	minLongitude: number;
	maxLongitude: number;
	gauge: number;
	importerId: string;
	path: string;
	

	$$meta = {
		source: "railway",

		columns: {
			id: { type: "uuid", name: "id" },
			minLatitude: { type: "float4", name: "min_latitude" },
			maxLatitude: { type: "float4", name: "max_latitude" },
			minLongitude: { type: "float4", name: "min_longitude" },
			maxLongitude: { type: "float4", name: "max_longitude" },
			gauge: { type: "float4", name: "gauge" },
			importerId: { type: "text", name: "importer_id" },
			path: { type: "text", name: "path" }
		},

		get set(): DbSet<Railway, RailwayQueryProxy> { 
			return new DbSet<Railway, RailwayQueryProxy>(Railway, null);
		}
	};
}
			
export class ImportQueryProxy extends QueryProxy {
	get created(): Partial<QueryTimeStamp> { throw new Error("Invalid use of QueryModels. QueryModels cannot be used during runtime"); }
	get centerLatitude(): Partial<QueryNumber> { throw new Error("Invalid use of QueryModels. QueryModels cannot be used during runtime"); }
	get minLatitude(): Partial<QueryNumber> { throw new Error("Invalid use of QueryModels. QueryModels cannot be used during runtime"); }
	get maxLatitude(): Partial<QueryNumber> { throw new Error("Invalid use of QueryModels. QueryModels cannot be used during runtime"); }
	get minLongitude(): Partial<QueryNumber> { throw new Error("Invalid use of QueryModels. QueryModels cannot be used during runtime"); }
	get maxLongitude(): Partial<QueryNumber> { throw new Error("Invalid use of QueryModels. QueryModels cannot be used during runtime"); }
	get centerLongitude(): Partial<QueryNumber> { throw new Error("Invalid use of QueryModels. QueryModels cannot be used during runtime"); }
}

export class Import extends Entity<ImportQueryProxy> {
	declare id: string;
	created: Date;
	centerLatitude: number;
	minLatitude: number;
	maxLatitude: number;
	minLongitude: number;
	maxLongitude: number;
	centerLongitude: number;
	

	$$meta = {
		source: "import",

		columns: {
			id: { type: "uuid", name: "id" },
			created: { type: "timestamp", name: "created" },
			centerLatitude: { type: "float4", name: "center_latitude" },
			minLatitude: { type: "float4", name: "min_latitude" },
			maxLatitude: { type: "float4", name: "max_latitude" },
			minLongitude: { type: "float4", name: "min_longitude" },
			maxLongitude: { type: "float4", name: "max_longitude" },
			centerLongitude: { type: "float4", name: "center_longitude" }
		},

		get set(): DbSet<Import, ImportQueryProxy> { 
			return new DbSet<Import, ImportQueryProxy>(Import, null);
		}
	};
}
			
export class TreeQueryProxy extends QueryProxy {
	get location(): Partial<QueryString> { throw new Error("Invalid use of QueryModels. QueryModels cannot be used during runtime"); }
	get importerId(): Partial<QueryString> { throw new Error("Invalid use of QueryModels. QueryModels cannot be used during runtime"); }
}

export class Tree extends Entity<TreeQueryProxy> {
	declare id: string;
	location: string;
	importerId: string;
	

	$$meta = {
		source: "tree",

		columns: {
			id: { type: "uuid", name: "id" },
			location: { type: "text", name: "location" },
			importerId: { type: "text", name: "importer_id" }
		},

		get set(): DbSet<Tree, TreeQueryProxy> { 
			return new DbSet<Tree, TreeQueryProxy>(Tree, null);
		}
	};
}
			

export class DbContext {
	street: DbSet<Street, StreetQueryProxy>;
	building: DbSet<Building, BuildingQueryProxy>;
	waterBody: DbSet<WaterBody, WaterBodyQueryProxy>;
	railway: DbSet<Railway, RailwayQueryProxy>;
	import: DbSet<Import, ImportQueryProxy>;
	tree: DbSet<Tree, TreeQueryProxy>;

	constructor(private runContext: RunContext) {
		this.street = new DbSet<Street, StreetQueryProxy>(Street, this.runContext);
		this.building = new DbSet<Building, BuildingQueryProxy>(Building, this.runContext);
		this.waterBody = new DbSet<WaterBody, WaterBodyQueryProxy>(WaterBody, this.runContext);
		this.railway = new DbSet<Railway, RailwayQueryProxy>(Railway, this.runContext);
		this.import = new DbSet<Import, ImportQueryProxy>(Import, this.runContext);
		this.tree = new DbSet<Tree, TreeQueryProxy>(Tree, this.runContext);
	}

	findSet(modelType) {
		for (let key in this) {
			if (this[key] instanceof DbSet) {
				if ((this[key] as any).modelConstructor == modelType) {
					return this[key];
				}
			}
		}
	}

	
};