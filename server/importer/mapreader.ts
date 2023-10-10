const file = 'map.osm';

export class MapReader {
    async readMap() {
        const map = await fetch(file).then(res => res.text());

        const parser = new DOMParser();
        return parser.parseFromString(map, 'text/xml');
    }

    getHouses() {
        let buildings: Element[];
        // get building ways

        // get corner points of buildings
        // convert corner points into polygon string

        // get address

        // calculate center point

        const xmlDoc = this.readMap();

        const ways = xmlDoc.getElementsByTagName('ways');

        // get xml tags of buildings
        for (let way of ways) {
            if(way.getElementsByTagName('tag').length != 0) {
                if (way.getAttribute('k') == 'building' && way.getAttribute('v') == 'yes') {
                    buildings.push(way);
                }
            }
        }

        // get corner points of buildings
        for (let building of buildings) {
            if (building.getElementsByTagName('nd').length != 0) {
                const nodes = xmlDoc.getElementsByTagName('nd');
                
                for (let node of nodes) {
                    if (node.hasAttribute('ref')) {
                        const nodeReference = node.getAttribute('red');

                        this.getNode(nodeReference);
                    }
                }
            }
        }
    }

    getNode(nodeReference: string) {
        const xmlDoc = this.readMap();

        //get node with the node reference as ID to get latitude and longitude
    }

}