CREATE TABLE bounding_boxes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    "polygon" TEXT
);