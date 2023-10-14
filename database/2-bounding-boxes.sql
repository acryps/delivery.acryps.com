CREATE TABLE bounding_boxes (
	id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

	"polygon" TEXT
);

ALTER TABLE bounding_boxes DROP "polygon";

ALTER TABLE bounding_boxes ADD latitude_max REAL;
ALTER TABLE bounding_boxes ADD latitude_min REAL;

ALTER TABLE bounding_boxes ADD longitude_max REAL;
ALTER TABLE bounding_boxes ADD longitude_min REAL;