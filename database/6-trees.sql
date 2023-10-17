CREATE TABLE tree (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    location TEXT,
    importer_id TEXT
)