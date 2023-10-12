DROP TABLE bounding_boxes;

CREATE TABLE import (
	id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
	created TIMESTAMP,
	
	center REAL,
	
	min_latitude REAL,
	max_latitude REAL,
	min_longitude REAL,
	max_longitude REAL
);