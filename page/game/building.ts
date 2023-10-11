import { Point } from "../../shared/point";
import { Rectangle } from "../../shared/rectangle";

export class Building {
	id: string;
	address: string;
	geometry: Point[];
	boundingBox: Rectangle;

	static from(serialized) {
		const building = new Building();
		building.id = serialized.id;
		building.address = serialized.address;
		building.geometry = serialized.geometry.map(point => Point.from(point));
		building.boundingBox = Rectangle.fromPolygon(building.geometry);

		return building;
	}
}