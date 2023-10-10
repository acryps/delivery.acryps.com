const file = 'map.osm';

export class MapReader {
    async readMap() {
        const toChange = await fetch(file).then(res => res.text());
    }
}