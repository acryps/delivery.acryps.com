import { Map } from "./map";
import { Point } from "./point";
import { Rectangle } from "./rectangle";

export const playerSpeed = 0.00001;

export function move(map: Map, current: Point, angle: number, deltaTime: number) {
	if (angle === null) {
		return new Point(current.latitude, current.longitude);
	}

	const targetPoint = new Point(
		current.latitude - Math.sin(angle) * playerSpeed * deltaTime,
		current.longitude - Math.cos(angle) * playerSpeed * deltaTime
	);

	if (isColliding(map, targetPoint)) {
		return new Point(current.latitude, current.longitude);
	} else {
		return targetPoint;
	}
}

function isColliding(map: Map, targetPoint: Point) {
	for (const building of map.buildings) {
		if (Rectangle.fromPolygon(building.geometry).contains(targetPoint)) {
			// TODO polygon intersect
			return true;
		}
	}

	return false;
}