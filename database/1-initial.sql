CREATE TABLE building (
	id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

	centerLatitude REAL,
	centerLongitude REAL,
	"polygon" TEXT,

	address TEXT
);

CREATE TABLE street (
	id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

	centerLatitude REAL,
	centerLongitude REAL,
	"polygon" TEXT,

	name TEXT
);

CREATE TABLE water_body (
	id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

	centerLatitude REAL,
	centerLongitude REAL,
	"polygon" TEXT,

	name TEXT
);