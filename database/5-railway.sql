CREATE TABLE railway (
	id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

	min_latitude REAL,
	max_latitude REAL,
	min_longitude REAL,
	max_longitude REAL,
	path TEXT,
	gauge REAL,

	importer_id TEXT
);