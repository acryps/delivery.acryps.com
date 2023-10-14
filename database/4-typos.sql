ALTER TABLE building RENAME COLUMN centerlatitude TO center_latitude;
ALTER TABLE building RENAME COLUMN centerlongitude TO center_longitude;

ALTER TABLE street RENAME COLUMN centerlatitude TO center_latitude;
ALTER TABLE street RENAME COLUMN centerlongitude TO center_longitude;

ALTER TABLE water_body RENAME COLUMN centerlatitude TO center_latitude;
ALTER TABLE water_body RENAME COLUMN centerlongitude TO center_longitude;