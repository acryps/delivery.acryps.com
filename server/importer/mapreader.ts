const file = 'map.osm';

export class MapReader {
    async readMap() {
        const toChange = await fetch(file).then(res => res.text());
    }


    getHouses() {
        // get building ways

        // get corner points of buildings
        // convert corner points into polygon string

        // get address

        // calculate center point

    }
}