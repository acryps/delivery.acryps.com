import { Entity, DbSet, RunContext, QueryUUID, QueryProxy, QueryString, QueryJSON, QueryTimeStamp, QueryNumber, QueryTime, QueryDate, QueryBoolean, QueryBuffer, QueryEnum, ForeignReference, PrimaryReference, View, ViewSet } from "vlquery";

export class BuildingQueryProxy extends QueryProxy {
	get centerlatitude(): Partial<QueryNumber> { throw new Error("Invalid use of QueryModels. QueryModels cannot be used during runtime"); }
	get centerlongitude(): Partial<QueryNumber> { throw new Error("Invalid use of QueryModels. QueryModels cannot be used during runtime"); }
	get polygon(): Partial<QueryString> { throw new Error("Invalid use of QueryModels. QueryModels cannot be used during runtime"); }
	get address(): Partial<QueryString> { throw new Error("Invalid use of QueryModels. QueryModels cannot be used during runtime"); }
}

export class Building extends Entity<BuildingQueryProxy> {
	declare id: string;
	centerlatitude: number;
	centerlongitude: number;
	polygon: string;
	address: string;
	

	$$meta = {
		source: "building",

		columns: {
			id: { type: "uuid", name: "id" },
			centerlatitude: { type: "float4", name: "centerlatitude" },
			centerlongitude: { type: "float4", name: "centerlongitude" },
			polygon: { type: "text", name: "polygon" },
			address: { type: "text", name: "address" }
		},

		get set(): DbSet<Building, BuildingQueryProxy> { 
			return new DbSet<Building, BuildingQueryProxy>(Building, null);
		}
	};
}
			
export class StreetQueryProxy extends QueryProxy {
	get centerlatitude(): Partial<QueryNumber> { throw new Error("Invalid use of QueryModels. QueryModels cannot be used during runtime"); }
	get centerlongitude(): Partial<QueryNumber> { throw new Error("Invalid use of QueryModels. QueryModels cannot be used during runtime"); }
	get polygon(): Partial<QueryString> { throw new Error("Invalid use of QueryModels. QueryModels cannot be used during runtime"); }
	get name(): Partial<QueryString> { throw new Error("Invalid use of QueryModels. QueryModels cannot be used during runtime"); }
}

export class Street extends Entity<StreetQueryProxy> {
	declare id: string;
	centerlatitude: number;
	centerlongitude: number;
	polygon: string;
	name: string;
	

	$$meta = {
		source: "street",

		columns: {
			id: { type: "uuid", name: "id" },
			centerlatitude: { type: "float4", name: "centerlatitude" },
			centerlongitude: { type: "float4", name: "centerlongitude" },
			polygon: { type: "text", name: "polygon" },
			name: { type: "text", name: "name" }
		},

		get set(): DbSet<Street, StreetQueryProxy> { 
			return new DbSet<Street, StreetQueryProxy>(Street, null);
		}
	};
}
			
export class WaterBodyQueryProxy extends QueryProxy {
	get centerlatitude(): Partial<QueryNumber> { throw new Error("Invalid use of QueryModels. QueryModels cannot be used during runtime"); }
	get centerlongitude(): Partial<QueryNumber> { throw new Error("Invalid use of QueryModels. QueryModels cannot be used during runtime"); }
	get polygon(): Partial<QueryString> { throw new Error("Invalid use of QueryModels. QueryModels cannot be used during runtime"); }
	get name(): Partial<QueryString> { throw new Error("Invalid use of QueryModels. QueryModels cannot be used during runtime"); }
}

export class WaterBody extends Entity<WaterBodyQueryProxy> {
	declare id: string;
	centerlatitude: number;
	centerlongitude: number;
	polygon: string;
	name: string;
	

	$$meta = {
		source: "water_body",

		columns: {
			id: { type: "uuid", name: "id" },
			centerlatitude: { type: "float4", name: "centerlatitude" },
			centerlongitude: { type: "float4", name: "centerlongitude" },
			polygon: { type: "text", name: "polygon" },
			name: { type: "text", name: "name" }
		},

		get set(): DbSet<WaterBody, WaterBodyQueryProxy> { 
			return new DbSet<WaterBody, WaterBodyQueryProxy>(WaterBody, null);
		}
	};
}
			

export class DbContext {
	building: DbSet<Building, BuildingQueryProxy>;
	street: DbSet<Street, StreetQueryProxy>;
	waterBody: DbSet<WaterBody, WaterBodyQueryProxy>;

	constructor(private runContext: RunContext) {
		this.building = new DbSet<Building, BuildingQueryProxy>(Building, this.runContext);
		this.street = new DbSet<Street, StreetQueryProxy>(Street, this.runContext);
		this.waterBody = new DbSet<WaterBody, WaterBodyQueryProxy>(WaterBody, this.runContext);
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