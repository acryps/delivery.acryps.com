DROP TABLE bounding_boxes;

CREATE TABLE import (
	id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

	created TIMESTAMP,
	
	center_latitude REAL,
	center_longitude REAL,
	
	min_latitude REAL,
	max_latitude REAL,
	min_longitude REAL,
	max_longitude REAL
);

ALTER TABLE building ADD importer_id TEXT;
ALTER TABLE building ADD address_real BOOLEAN;
