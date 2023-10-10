import { Coordinates } from "./coordinates";
import * as convert from "xml-js";
import * as fs from 'fs';

const fileName = 'map';
const cwd = process.cwd() + "/importer";

export class MapReader {

	async readMap() {

		const xmlFilePath = cwd + "/map/" + fileName + ".osm";

		try {
			let xmlData = fs.readFileSync(xmlFilePath, 'utf8');
			let jsonString = convert.xml2json(xmlData, {compact: false, spaces: 4});
			var jsonData = JSON.parse(jsonString);

			// const filePath = cwd + "/map/" + fileName + ".json";
			// try {
			// 	fs.writeFileSync(filePath, jsonString, 'utf-8');
			// 	console.log(`JSON data has been written to ${filePath}`);
			// } catch (error) {
			// 	console.error(`Error writing to file: ${error}`);
			// }

		} catch (error) {
			console.error(error);
		}

		console.log(jsonData.elements[0].elements);

		let nodes = jsonData.elements[0].elements.filter(element => element.name == "node");
		let ways = jsonData.elements[0].elements.filter(element => element.name == "way");
		let relations = jsonData.elements[0].elements.filter(element => element.name == "relation");

		console.log(ways);

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

	getStreets() {
		// todo: figure out what types of streets there are and bundle them
		// bridges, highways, paths, streets, mainstreets, ... => streets
	
		// get street names
	
		// get corner points
	
		// calculate center
	
	}
	
	calculateCenter(coordinates: Coordinates[]): Coordinates {
		let center: Coordinates = null;
		// todo: implement center calculations
	
		return center;
	}
}


