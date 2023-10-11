import { Point } from "../../shared/point";
import { Rectangle } from "../../shared/rectangle";

export class Building {
	geometry: Point[];
	boundingBox: Rectangle;

	static from(serialized) {
		const building = new Building();
		building.geometry = serialized.geometry.map(point => Point.from(point));
		building.boundingBox = Rectangle.fromPolygon(building.geometry);

		return building;
	}
}